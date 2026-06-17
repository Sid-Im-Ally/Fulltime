export type DimId = 'technical' | 'tactical' | 'physical' | 'psychological' | 'social';

export const CORNERS: { id: DimId; label: string; blurb: string }[] = [
  { id: 'technical',     label: 'Technical',          blurb: 'First touch, striking, ball manipulation' },
  { id: 'tactical',      label: 'Tactical / Game IQ', blurb: 'Decisions, positioning, awareness' },
  { id: 'physical',      label: 'Physical',           blurb: 'Speed, agility, endurance' },
  { id: 'psychological', label: 'Psychological',      blurb: 'Coachability, resilience, drive' },
  { id: 'social',        label: 'Social',             blurb: 'Communication, team integration' },
];

export interface DimConfig { id: DimId; label: string; weight: number | null; } // null weight => unweighted
export interface PlayerRow {
  name: string;
  scores: Partial<Record<DimId, number | null>>;
  birthQuarter?: number | null;     // 1..4 or null
  storedComposite?: number | null;  // from file, or null
}
export interface Evaluation {
  dims: DimConfig[];
  players: PlayerRow[];
  scaleMin: number;            // default 1
  scaleMax: number;            // default 10
  weighted: boolean;           // did the user provide weights?
  hasStoredComposite: boolean;
  hasBirthData: boolean;
}

const round2 = (x: number) => Math.round(x * 100) / 100;
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const sd = (a: number[]) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length); };

export function composite(scores: PlayerRow['scores'], dims: DimConfig[], weighted: boolean): number | null {
  let acc = 0, wsum = 0;
  for (const d of dims) {
    const v = scores[d.id];
    if (v === null || v === undefined) continue;            // renormalize over present dims
    const w = weighted && d.weight != null ? d.weight : 1;
    acc += v * w; wsum += w;
  }
  return wsum === 0 ? null : acc / wsum;
}

export interface Flag { kind: 'integrity' | 'hygiene'; title: string; plain?: string; evidence: string; }
export interface Report {
  ranked: (PlayerRow & { composite: number | null; rank: number })[];
  integrity: Flag[];
  hygiene: Flag[];
  coverage: { id: DimId; label: string; blurb: string; measured: boolean; weight: number | null }[];
  gaps: { id: DimId; label: string }[];
  stats: { mean: number; sd: number; avgWithinSD: number; weightSum: number | null };
  integrityClean: boolean;
}

export function analyze(ev: Evaluation): Report {
  const { dims, players, scaleMin, scaleMax, weighted, hasStoredComposite, hasBirthData } = ev;
  const range = (scaleMax - scaleMin) || 1;
  const mid = (scaleMin + scaleMax) / 2;

  let missing = 0, oor = 0;
  const drift: { name: string; stored: string; recomputed: string }[] = [];
  const all: number[] = [];

  const enriched = players.map(p => {
    for (const d of dims) {
      const v = p.scores[d.id];
      if (v === null || v === undefined) { missing++; continue; }
      if (v < scaleMin || v > scaleMax) oor++;
      all.push(v);
    }
    const recomputed = composite(p.scores, dims, weighted);
    if (hasStoredComposite && p.storedComposite != null && recomputed != null &&
        Math.abs(p.storedComposite - recomputed) > 0.1) {
      drift.push({ name: p.name, stored: p.storedComposite.toFixed(2), recomputed: recomputed.toFixed(2) });
    }
    return { ...p, composite: recomputed };
  });

  const ranked = [...enriched]
    .sort((a, b) => (b.composite ?? -Infinity) - (a.composite ?? -Infinity))
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const m = all.length ? mean(all) : 0;
  const s = all.length ? sd(all) : 0;

  const withinSDs = enriched.map(p => {
    const vals = dims.map(d => p.scores[d.id]).filter((v): v is number => v != null);
    return vals.length >= 2 ? sd(vals) : null;
  }).filter((x): x is number => x != null);
  const avgWithinSD = withinSDs.length ? mean(withinSDs) : 0;

  const comps = ranked.map(p => p.composite).filter((x): x is number => x != null);
  const tieWin = 0.0167 * range;
  let near = 0;
  comps.forEach((c, i) => { if (comps.some((o, j) => i !== j && Math.abs(o - c) <= tieWin)) near++; });
  const tieShare = comps.length ? near / comps.length : 0;

  let q1Top = 0;
  if (hasBirthData) {
    const top = ranked.slice(0, Math.max(1, Math.round(ranked.length / 3)));
    q1Top = top.filter(p => p.birthQuarter === 1).length / top.length;
  }

  const weightSum = weighted ? dims.reduce((a, d) => a + (d.weight ?? 0), 0) : null;

  const integrity: Flag[] = [];
  if (weighted && weightSum !== 100)
    integrity.push({ kind: 'integrity', title: "Dimension weights don't sum to 100",
      evidence: `Weights total ${weightSum}, not 100. Composites are built on an off-base set of weights.` });
  if (drift.length)
    integrity.push({ kind: 'integrity', title: `${drift.length} composite${drift.length > 1 ? 's' : ''} don't match the inputs`,
      evidence: `e.g. ${drift[0].name}: file shows ${drift[0].stored}, inputs recompute to ${drift[0].recomputed}. A broken or overridden formula.` });
  if (missing)
    integrity.push({ kind: 'integrity', title: `${missing} blank score${missing > 1 ? 's' : ''}`,
      evidence: 'Some players were not scored on every dimension, so their composites rest on fewer inputs than others.' });
  if (oor)
    integrity.push({ kind: 'integrity', title: `${oor} score${oor > 1 ? 's' : ''} outside the ${scaleMin}–${scaleMax} scale`,
      evidence: "Values fall outside the rubric's own range." });

  const hygiene: Flag[] = [];
  if (s < 0.13 * range && Math.abs(m - mid) < 0.13 * range)
    hygiene.push({ kind: 'hygiene', title: 'Central tendency',
      plain: 'The evaluator rarely used the top or bottom of the scale — most players sit in the middle.',
      evidence: `Spread of all scores is narrow (SD ${round2(s)}) and clustered near the midpoint (mean ${round2(m)}).` });
  if (m > scaleMin + 0.73 * range)
    hygiene.push({ kind: 'hygiene', title: 'Leniency', plain: 'Scores skew high across the board.',
      evidence: `Average score is ${round2(m)} of ${scaleMax}.` });
  if (m < scaleMin + 0.27 * range)
    hygiene.push({ kind: 'hygiene', title: 'Strictness', plain: 'Scores skew low across the board.',
      evidence: `Average score is ${round2(m)} of ${scaleMax}.` });
  if (avgWithinSD < 0.073 * range && dims.length >= 2)
    hygiene.push({ kind: 'hygiene', title: 'Halo effect',
      plain: "Players tend to get nearly the same score on every dimension — a 'good at everything' pattern rather than distinct strengths and weaknesses.",
      evidence: `Average within-player spread across dimensions is only ${round2(avgWithinSD)}.` });
  if (tieShare > 0.4)
    hygiene.push({ kind: 'hygiene', title: 'Low discrimination',
      plain: 'Many players have near-identical composites, so the ranking separates them by tiny, possibly meaningless margins.',
      evidence: `${Math.round(tieShare * 100)}% of players sit within ${round2(tieWin)} of another player's composite.` });
  if (hasBirthData && q1Top > 0.5)
    hygiene.push({ kind: 'hygiene', title: 'Relative age effect',
      plain: 'The top of the ranking is dominated by players born early in the selection year — older and more physically mature at this age, not necessarily more able.',
      evidence: `${Math.round(q1Top * 100)}% of the top third were born in the first birth-quarter (~25% expected by chance).` });

  const coverage = CORNERS.map(c => {
    const d = dims.find(x => x.id === c.id);
    return { ...c, measured: !!d, weight: d ? d.weight : null };
  });
  const gaps = coverage.filter(c => !c.measured).map(c => ({ id: c.id, label: c.label }));

  return { ranked, integrity, hygiene, coverage, gaps,
    stats: { mean: m, sd: s, avgWithinSD, weightSum }, integrityClean: integrity.length === 0 };
}
