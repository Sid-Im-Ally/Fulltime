/* ============================================================
   In-app evaluation model — behaviorally anchored, 1–5 per skill.
   Skills roll up into the four/five-corner model so the result feeds
   the existing analyze()/composite() in lib/analysis.ts unchanged.
   Session-only: nothing here persists or leaves the browser.
   ============================================================ */

import { composite, DimConfig, DimId, Evaluation, PlayerRow } from './analysis';

export type SkillId =
  | 'dribbling' | 'receiving' | 'shooting' | 'passing' | 'kicking' | 'footwork'
  | 'defense' | 'attacking' | 'tracking'
  | 'endurance'
  | 'coachability' | 'communication';

export interface SkillAnchors { low: string; mid: string; high: string; }
export interface Skill {
  id: SkillId;
  label: string;
  corner: DimId;       // which four/five-corner this skill rolls up into
  optional?: boolean;  // psychological & social — off by default
  anchors: SkillAnchors;
}

/** The ten default skills + two optional (psychological, social). Order = grid column order. */
export const SKILLS: Skill[] = [
  {
    id: 'dribbling', label: 'Dribbling', corner: 'technical',
    anchors: {
      low: 'Loses control under light pressure, head down.',
      mid: 'Close control at pace in space, head up at times.',
      high: 'Beats opponents 1v1 with changes of pace and direction, head up, both feet.',
    },
  },
  {
    id: 'receiving', label: 'Receiving (first touch)', corner: 'technical',
    anchors: {
      low: 'Touch bounces away, needs extra touches to settle.',
      mid: 'Controls into space most times.',
      high: 'First touch sets up the next action; receives on the half-turn under pressure.',
    },
  },
  {
    id: 'shooting', label: 'Shooting', corner: 'technical',
    anchors: {
      low: 'Inconsistent contact, little power or placement.',
      mid: 'Strikes cleanly, hits target from range.',
      high: 'Accurate and powerful off both feet, composed in the box.',
    },
  },
  {
    id: 'passing', label: 'Passing', corner: 'technical',
    anchors: {
      low: 'Inaccurate over short range, telegraphs the pass.',
      mid: 'Accurate short and medium, weight mostly right.',
      high: 'Varies range and weight, breaks lines, both feet.',
    },
  },
  {
    id: 'kicking', label: 'Kicking', corner: 'technical',
    anchors: {
      low: 'Limited distance and technique, one foot.',
      mid: 'Clears and drives with decent technique.',
      high: 'Strikes long and accurately off both feet, clean contact.',
    },
  },
  {
    id: 'footwork', label: 'Footwork', corner: 'technical',
    anchors: {
      low: 'Heavy and clumsy, limited agility.',
      mid: 'Balanced and agile in space.',
      high: 'Quick feet, sharp changes of direction, balanced under pressure.',
    },
  },
  {
    id: 'defense', label: 'Defense', corner: 'tactical',
    anchors: {
      low: 'Ball-watches, dives in, poor position.',
      mid: 'Stays goal-side, times tackles reasonably.',
      high: 'Reads play, intercepts, jockeys and wins the ball cleanly.',
    },
  },
  {
    id: 'attacking', label: 'Attacking', corner: 'tactical',
    anchors: {
      low: 'Static, waits for the ball.',
      mid: 'Makes runs, supports attacks.',
      high: 'Times runs, creates space, delivers end product (assists/goals).',
    },
  },
  {
    id: 'tracking', label: 'Tracking', corner: 'tactical',
    anchors: {
      low: 'Loses runners, doesn’t recover.',
      mid: 'Tracks back, picks up runners most times.',
      high: 'Anticipates and tracks runners, communicates, covers teammates.',
    },
  },
  {
    id: 'endurance', label: 'Endurance', corner: 'physical',
    anchors: {
      low: 'Fades early, low work rate.',
      mid: 'Sustains effort most of the match.',
      high: 'High work rate for the full match, recovers quickly between efforts.',
    },
  },
  {
    id: 'coachability', label: 'Coachability', corner: 'psychological', optional: true,
    anchors: {
      low: 'Disengages from feedback.',
      mid: 'Listens and applies most feedback.',
      high: 'Seeks feedback, applies it fast, resilient after mistakes.',
    },
  },
  {
    id: 'communication', label: 'Communication', corner: 'social', optional: true,
    anchors: {
      low: 'Silent, isolated.',
      mid: 'Communicates with nearby teammates.',
      high: 'Organizes, encourages, lifts the group.',
    },
  },
];

export const SCALE_MIN = 1;
export const SCALE_MAX = 5;

/** Skills in play given whether the optional psychological & social corners are enabled. */
export function activeSkills(includeOptional: boolean): Skill[] {
  return SKILLS.filter(s => includeOptional || !s.optional);
}

/** A single player row in the grid. Scores are 1..5 or null (never defaulted to a midpoint). */
export interface PlayerEntry {
  id: string;                                  // stable React key for the session
  name: string;
  birth: string | null;                        // 'YYYY-MM-DD' or null
  notes: string;                               // evaluator's free-text note for this player
  scores: Partial<Record<SkillId, number | null>>;
}

export type Weights = Partial<Record<SkillId, number>>;

let _seq = 0;
export function newPlayer(name: string): PlayerEntry {
  _seq += 1;
  return { id: `p${Date.now()}_${_seq}`, name: name.trim(), birth: null, notes: '', scores: {} };
}

/** Month index of a 'YYYY-MM-DD' string → birth quarter 1..4 (Jan-1 cutoff), or null. */
export function birthQuarter(birth: string | null): number | null {
  if (!birth) return null;
  const m = parseInt(birth.slice(5, 7), 10);            // 01..12
  if (!Number.isFinite(m) || m < 1 || m > 12) return null;
  return Math.floor((m - 1) / 3) + 1;
}

/**
 * Live overall for one player = mean of that player's ENTERED skill scores,
 * renormalised over entered skills — computed by reusing composite() so the grid
 * and the report share one definition. Honors per-skill weights when weighted.
 */
export function playerOverall(
  entry: PlayerEntry,
  skills: Skill[],
  weighted: boolean,
  weights: Weights,
): number | null {
  // Treat each skill as a dimension; composite() keys by id and renormalises over present values.
  const scores: PlayerRow['scores'] = {};
  const dims: DimConfig[] = skills.map(s => {
    scores[s.id as unknown as DimId] = entry.scores[s.id] ?? null;
    return {
      id: s.id as unknown as DimId,
      label: s.label,
      weight: weighted ? (weights[s.id] ?? 0) : null,
    };
  });
  return composite(scores, dims, weighted);
}

export interface RankedEntry { entry: PlayerEntry; overall: number | null; rank: number | null; }

/** Rank players by live overall. Unscored players are unranked (rank: null), not ranked at 0. */
export function rankEntries(
  entries: PlayerEntry[],
  skills: Skill[],
  weighted: boolean,
  weights: Weights,
): RankedEntry[] {
  const withOverall = entries.map(entry => ({
    entry,
    overall: playerOverall(entry, skills, weighted, weights),
  }));
  const scored = withOverall
    .filter(r => r.overall != null)
    .sort((a, b) => (b.overall as number) - (a.overall as number));
  const rankById = new Map<string, number>();
  scored.forEach((r, i) => rankById.set(r.entry.id, i + 1));
  return withOverall.map(r => ({ ...r, rank: rankById.get(r.entry.id) ?? null }));
}

/** Sum of weights across the in-play skills (for the weighted-mode validation line). */
export function weightSum(skills: Skill[], weights: Weights): number {
  return skills.reduce((a, s) => a + (weights[s.id] ?? 0), 0);
}

/**
 * Aggregate the skill grid into the four/five-corner Evaluation that analyze() expects.
 * A player's corner score is the mean of their entered skills in that corner; corners with
 * no in-play skills are left out of dims (so coverage honestly reports them "Not measured").
 */
export function toEvaluation(
  entries: PlayerEntry[],
  includeOptional: boolean,
  weighted: boolean,
  weights: Weights,
): Evaluation {
  const skills = activeSkills(includeOptional);
  const corners = CORNER_ORDER.filter(c => skills.some(s => s.corner === c.id));

  const dims: DimConfig[] = corners.map(c => ({
    id: c.id,
    label: c.label,
    weight: weighted
      ? skills.filter(s => s.corner === c.id).reduce((a, s) => a + (weights[s.id] ?? 0), 0)
      : null,
  }));

  const players: PlayerRow[] = entries.map(entry => {
    const scores: Partial<Record<DimId, number | null>> = {};
    for (const c of corners) {
      const vals = skills
        .filter(s => s.corner === c.id)
        .map(s => entry.scores[s.id])
        .filter((v): v is number => v != null);
      scores[c.id] = vals.length ? vals.reduce((a, v) => a + v, 0) / vals.length : null;
    }
    return {
      name: entry.name || 'Unnamed',
      scores,
      birthQuarter: birthQuarter(entry.birth),
      storedComposite: null,
    };
  });

  return {
    dims,
    players,
    scaleMin: SCALE_MIN,
    scaleMax: SCALE_MAX,
    weighted,
    hasStoredComposite: false,
    hasBirthData: entries.some(e => birthQuarter(e.birth) != null),
  };
}

/** Corner id/label/blurb in grid order — mirrors CORNERS in lib/analysis without re-importing layout. */
const CORNER_ORDER: { id: DimId; label: string }[] = [
  { id: 'technical',     label: 'Technical' },
  { id: 'tactical',      label: 'Tactical / Game IQ' },
  { id: 'physical',      label: 'Physical' },
  { id: 'psychological', label: 'Psychological' },
  { id: 'social',        label: 'Social' },
];

/* ------------------------------------------------------------
   La Masia illustrative sample — FICTIONAL, not real player data.
   Demonstrates the academy emphasis: a small, technically excellent
   midfielder out-ranks a physically strong but technically raw player.
   ------------------------------------------------------------ */
type SampleScores = Record<SkillId, number>;
interface SampleSpec { name: string; birth: string; notes: string; scores: SampleScores; }

const LA_MASIA_SPECS: SampleSpec[] = [
  {
    name: 'Pau', birth: '2014-08-12',
    notes: 'Small, two-footed playmaker. First touch and passing range stand out — manage minutes for endurance.',
    scores: { dribbling: 5, receiving: 5, shooting: 4, passing: 5, kicking: 3, footwork: 5,
      defense: 4, attacking: 5, tracking: 5, endurance: 3, coachability: 5, communication: 5 },
  },
  {
    name: 'Nil', birth: '2014-05-03',
    notes: 'High work-rate engine. Reads the game, covers ground, organises from midfield.',
    scores: { dribbling: 4, receiving: 4, shooting: 3, passing: 4, kicking: 3, footwork: 4,
      defense: 5, attacking: 4, tracking: 5, endurance: 5, coachability: 5, communication: 4 },
  },
  {
    name: 'Sergi', birth: '2014-11-21',
    notes: 'Reliable and balanced. Few weaknesses, no standout corner yet.',
    scores: { dribbling: 3, receiving: 4, shooting: 3, passing: 4, kicking: 3, footwork: 4,
      defense: 4, attacking: 4, tracking: 4, endurance: 4, coachability: 4, communication: 4 },
  },
  {
    name: 'Ferran', birth: '2014-03-09',
    notes: 'Natural finisher. Lively in the box; needs to track back and defend more.',
    scores: { dribbling: 4, receiving: 4, shooting: 5, passing: 3, kicking: 4, footwork: 4,
      defense: 2, attacking: 5, tracking: 2, endurance: 4, coachability: 3, communication: 3 },
  },
  {
    name: 'Oriol', birth: '2014-09-30',
    notes: 'Strong, dominant defender. Composure and passing under pressure to develop.',
    scores: { dribbling: 2, receiving: 2, shooting: 2, passing: 3, kicking: 4, footwork: 2,
      defense: 5, attacking: 2, tracking: 4, endurance: 5, coachability: 4, communication: 3 },
  },
  {
    name: 'Marc', birth: '2014-02-18',
    notes: 'Powerful and athletic but technically raw. First touch and decision-making are the priority.',
    scores: { dribbling: 3, receiving: 2, shooting: 4, passing: 2, kicking: 5, footwork: 2,
      defense: 3, attacking: 2, tracking: 2, endurance: 5, coachability: 3, communication: 3 },
  },
];

/** Build the La Masia sample roster (includes the optional corners). */
export function laMasiaPlayers(): PlayerEntry[] {
  _seq = 0;
  return LA_MASIA_SPECS.map(spec => {
    _seq += 1;
    return {
      id: `lamasia_${_seq}`,
      name: spec.name,
      birth: spec.birth,
      notes: spec.notes,
      scores: { ...spec.scores },
    };
  });
}
