import { composite, DimConfig, DimId, Evaluation, PlayerRow } from './analysis';

// Deterministic PRNG so demos are stable across reloads.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = [
  'Théo', 'Rafa', 'Jules', 'Sam', 'Ade', 'Mo', 'Leo', 'Kai', 'Noah', 'Finn',
  'Ezra', 'Omar', 'Luca', 'Milo', 'Reece', 'Dani', 'Arlo', 'Cole', 'Jude', 'Beau',
  'Ravi', 'Tariq', 'Niko', 'Seb', 'Marco', 'Idris', 'Zane', 'Hugo', 'Otis', 'Remy',
];

const uniform = (rng: () => number, lo: number, hi: number) => lo + rng() * (hi - lo);
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const half = (x: number) => Math.round(x * 2) / 2;

export interface SampleDef {
  id: string;
  label: string;
  description: string;
  build: () => Evaluation;
}

// CLEAN — well-formed weighted evaluation with real spread, no obvious problems.
function buildClean(): Evaluation {
  const rng = mulberry32(42);
  const dims: DimConfig[] = [
    { id: 'technical',     label: 'Technical',          weight: 30 },
    { id: 'tactical',      label: 'Tactical / Game IQ', weight: 25 },
    { id: 'physical',      label: 'Physical',           weight: 20 },
    { id: 'psychological', label: 'Psychological',      weight: 15 },
    { id: 'social',        label: 'Social',             weight: 10 },
  ];
  const players: PlayerRow[] = NAMES.map(name => {
    const base = uniform(rng, 2, 9.5);
    const scores: Partial<Record<DimId, number | null>> = {};
    for (const d of dims) {
      scores[d.id] = half(clamp(base + uniform(rng, -1.7, 1.7), 1, 10));
    }
    const birthQuarter = 1 + Math.floor(rng() * 4);
    return {
      name,
      scores,
      birthQuarter,
      storedComposite: round2(composite(scores, dims, true)!),
    };
  });
  return {
    dims, players, scaleMin: 1, scaleMax: 10,
    weighted: true, hasStoredComposite: true, hasBirthData: true,
  };
}

// TYPICAL — the kind of file that fires several flags: weights off-base,
// coverage gaps, halo + central tendency, relative-age skew, a blank, a drifted composite.
function buildTypical(): Evaluation {
  const rng = mulberry32(7);
  const dims: DimConfig[] = [
    { id: 'technical',     label: 'Technical',     weight: 45 },
    { id: 'physical',      label: 'Physical',      weight: 35 },
    { id: 'psychological', label: 'Psychological', weight: 15 },
  ];
  const players: PlayerRow[] = NAMES.map(name => {
    const base = uniform(rng, 4.5, 7.5);
    const scores: Partial<Record<DimId, number | null>> = {};
    for (const d of dims) {
      scores[d.id] = half(clamp(base + uniform(rng, -0.25, 0.25), 1, 10));
    }
    return { name, scores, birthQuarter: null as number | null, storedComposite: null as number | null, _base: base } as PlayerRow & { _base: number };
  }) as (PlayerRow & { _base: number })[];

  // Relative age effect: rank on base desc, give the top 60% mostly Q1.
  const order = [...players].sort((a, b) => (b as PlayerRow & { _base: number })._base - (a as PlayerRow & { _base: number })._base);
  const cutoff = Math.round(order.length * 0.6);
  order.forEach((p, i) => {
    if (i < cutoff) p.birthQuarter = rng() < 0.82 ? 1 : 1 + Math.floor(rng() * 4);
    else p.birthQuarter = 1 + Math.floor(rng() * 4);
  });

  // One blank score (a player not scored on physical).
  players[3].scores.physical = null;

  // Correct stored composites first…
  for (const p of players) p.storedComposite = round2(composite(p.scores, dims, true)!);
  // …then overwrite one to introduce formula drift.
  players[6].storedComposite = round2((players[6].storedComposite as number) + 1.8);

  const clean: PlayerRow[] = players.map(({ name, scores, birthQuarter, storedComposite }) => ({
    name, scores, birthQuarter, storedComposite,
  }));

  return {
    dims, players: clean, scaleMin: 1, scaleMax: 10,
    weighted: true, hasStoredComposite: true, hasBirthData: true,
  };
}

const round2 = (x: number) => Math.round(x * 100) / 100;

export const SAMPLES: SampleDef[] = [
  {
    id: 'clean',
    label: 'Clean evaluation',
    description: 'A well-formed file: weights sum to 100, real spread, all five corners scored.',
    build: buildClean,
  },
  {
    id: 'typical',
    label: 'Typical evaluation',
    description: 'A realistic messy file: off-base weights, missing corners, halo, age skew, a drifted composite.',
    build: buildTypical,
  },
];
