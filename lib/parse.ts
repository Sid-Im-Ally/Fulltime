import * as XLSX from 'xlsx';
import { CORNERS, DimConfig, DimId, Evaluation, PlayerRow } from './analysis';

export type ColumnRole =
  | 'name'
  | DimId
  | 'birth'
  | 'composite'
  | 'ignore';

export interface ParsedSheet {
  columns: string[];
  rows: Record<string, unknown>[];
}

export const ROLE_OPTIONS: { value: ColumnRole; label: string }[] = [
  { value: 'name',          label: 'Player name' },
  { value: 'technical',     label: 'Technical' },
  { value: 'tactical',      label: 'Tactical / Game IQ' },
  { value: 'physical',      label: 'Physical' },
  { value: 'psychological', label: 'Psychological' },
  { value: 'social',        label: 'Social' },
  { value: 'birth',         label: 'Birth date' },
  { value: 'composite',     label: 'Stored composite' },
  { value: 'ignore',        label: 'Ignore' },
];

const DIM_IDS: DimId[] = CORNERS.map(c => c.id);

/** Read an uploaded file entirely in the browser. Nothing leaves the device. */
export async function readWorkbook(file: File): Promise<ParsedSheet> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const first = wb.SheetNames[0];
  if (!first) return { columns: [], rows: [] };
  const ws = wb.Sheets[first];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false, defval: null });
  if (!aoa.length) return { columns: [], rows: [] };

  const header = (aoa[0] as unknown[]).map((c, i) =>
    c == null || String(c).trim() === '' ? `Column ${i + 1}` : String(c).trim()
  );
  const rows: Record<string, unknown>[] = [];
  for (let r = 1; r < aoa.length; r++) {
    const raw = aoa[r] as unknown[];
    if (!raw || raw.every(v => v == null || String(v).trim() === '')) continue;
    const obj: Record<string, unknown> = {};
    header.forEach((h, i) => { obj[h] = raw[i] ?? null; });
    rows.push(obj);
  }
  return { columns: header, rows };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Fuzzy header → role guess. User can override in the mapper. */
export function guessMapping(columns: string[]): Record<string, ColumnRole> {
  const map: Record<string, ColumnRole> = {};
  let nameTaken = false;
  for (const col of columns) {
    const n = norm(col);
    let role: ColumnRole = 'ignore';
    if (!nameTaken && (n.includes('name') || n === 'player' || n.includes('athlete'))) {
      role = 'name'; nameTaken = true;
    } else if (n.includes('technical') || n === 'tech') {
      role = 'technical';
    } else if (n.includes('tactical') || n.includes('gameiq') || n.includes('iq') || n.includes('awareness')) {
      role = 'tactical';
    } else if (n.includes('physical') || n.includes('athletic') || n.includes('speed')) {
      role = 'physical';
    } else if (n.includes('psych') || n.includes('mental') || n.includes('attitude')) {
      role = 'psychological';
    } else if (n.includes('social') || n.includes('communication') || n.includes('teamwork')) {
      role = 'social';
    } else if (n.includes('birth') || n.includes('dob') || n.includes('dateofbirth')) {
      role = 'birth';
    } else if (n.includes('composite') || n.includes('overall') || n.includes('total') || n.includes('rating') || n.includes('score') && !DIM_IDS.some(d => n.includes(d))) {
      role = 'composite';
    }
    map[col] = role;
  }
  return map;
}

function toNumber(v: unknown): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** Month (0-11) → birth quarter 1..4. Selection-year cutoff assumed Jan 1. */
function monthToQuarter(month: number): number {
  return Math.floor(month / 3) + 1;
}

function toBirthQuarter(v: unknown): number | null {
  if (v == null || v === '') return null;
  let d: Date | null = null;
  if (v instanceof Date) {
    d = v;
  } else if (typeof v === 'number') {
    // Excel serial date → JS Date (epoch 1899-12-30).
    d = new Date(Math.round((v - 25569) * 86400 * 1000));
  } else {
    const parsed = new Date(String(v));
    if (!isNaN(parsed.getTime())) d = parsed;
  }
  if (!d || isNaN(d.getTime())) return null;
  return monthToQuarter(d.getUTCMonth());
}

export interface BuildOptions {
  scaleMin: number;
  scaleMax: number;
  weighted: boolean;
  weights: Partial<Record<DimId, number>>;
}

/** Turn a parsed sheet + a user column-mapping into an Evaluation for analyze(). */
export function buildEvaluation(
  sheet: ParsedSheet,
  mapping: Record<string, ColumnRole>,
  opts: BuildOptions
): Evaluation {
  // Which sheet column feeds each role.
  const colFor = (role: ColumnRole): string | undefined =>
    Object.keys(mapping).find(c => mapping[c] === role);

  const nameCol = colFor('name');
  const birthCol = colFor('birth');
  const compositeCol = colFor('composite');

  const mappedDims: DimId[] = DIM_IDS.filter(id => !!colFor(id));

  const dims: DimConfig[] = CORNERS
    .filter(c => mappedDims.includes(c.id))
    .map(c => ({
      id: c.id,
      label: c.label,
      weight: opts.weighted ? (opts.weights[c.id] ?? 0) : null,
    }));

  const players: PlayerRow[] = sheet.rows.map((row, i) => {
    const scores: Partial<Record<DimId, number | null>> = {};
    for (const id of mappedDims) {
      const col = colFor(id)!;
      scores[id] = toNumber(row[col]);
    }
    return {
      name: nameCol ? String(row[nameCol] ?? `Player ${i + 1}`) : `Player ${i + 1}`,
      scores,
      birthQuarter: birthCol ? toBirthQuarter(row[birthCol]) : null,
      storedComposite: compositeCol ? toNumber(row[compositeCol]) : null,
    };
  });

  return {
    dims,
    players,
    scaleMin: opts.scaleMin,
    scaleMax: opts.scaleMax,
    weighted: opts.weighted,
    hasStoredComposite: !!compositeCol,
    hasBirthData: !!birthCol,
  };
}
