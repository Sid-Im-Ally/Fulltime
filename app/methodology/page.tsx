import Link from 'next/link';
import { CORNERS } from '@/lib/analysis';
import { PRODUCT_NAME } from '@/lib/brand';

export const metadata = {
  title: `Methodology — ${PRODUCT_NAME}`,
};

type Check = { title: string; when: string; scale: string; plain: string };

// Data-integrity checks — objective defects in how the file is built.
// Conditions mirror lib/analysis.ts exactly.
const INTEGRITY: Check[] = [
  {
    title: 'Weights don’t sum to 100',
    when: 'weights entered AND Σ(weights) ≠ 100',
    scale: 'Only runs when you choose to enter weights.',
    plain: 'The composite is being built on an off-base set of weights, so every ranking position rests on arithmetic that doesn’t add up.',
  },
  {
    title: 'A stored result doesn’t match its inputs',
    when: '| stored composite − recomputed composite | > 0.1',
    scale: 'Only runs when a “stored composite” column is mapped.',
    plain: 'The overall number saved in the file disagrees with what its own scores produce — a sign of a broken or manually overridden formula.',
  },
  {
    title: 'Blank scores',
    when: 'any mapped dimension is empty for a player',
    scale: 'Counts every empty cell across all mapped dimensions.',
    plain: 'Some players were not scored on every dimension, so their composite rests on fewer inputs than everyone else’s.',
  },
  {
    title: 'Scores outside the scale',
    when: 'score < scaleMin OR score > scaleMax',
    scale: 'On a 1–10 scale, anything below 1 or above 10.',
    plain: 'A value falls outside the rubric’s own rating range — usually a typo or a mis-keyed cell.',
  },
];

// Scoring-hygiene signals — patterns known to bias rankings. Thresholds are
// range-relative (range = scaleMax − scaleMin). Concrete values shown for 1–10 (range = 9).
const HYGIENE: Check[] = [
  {
    title: 'Central tendency',
    when: 'SD(all scores) < 0.13 × range AND | mean − midpoint | < 0.13 × range',
    scale: 'On 1–10: spread under 1.17 and mean within 1.17 of 5.5.',
    plain: 'The evaluator rarely used the top or bottom of the scale — most players sit in the middle, so the ranking has little to separate them.',
  },
  {
    title: 'Leniency',
    when: 'mean(all scores) > scaleMin + 0.73 × range',
    scale: 'On 1–10: average above 7.57.',
    plain: 'Scores skew high across the board, compressing the strong players together at the top.',
  },
  {
    title: 'Strictness',
    when: 'mean(all scores) < scaleMin + 0.27 × range',
    scale: 'On 1–10: average below 3.43.',
    plain: 'Scores skew low across the board, compressing players together at the bottom.',
  },
  {
    title: 'Halo effect',
    when: 'average within-player SD across dimensions < 0.073 × range  (needs ≥ 2 dimensions)',
    scale: 'On 1–10: a player’s scores typically vary by less than 0.66.',
    plain: 'Players tend to get nearly the same mark on every dimension — a “good at everything” pattern rather than distinct strengths and weaknesses.',
  },
  {
    title: 'Low discrimination',
    when: 'more than 40% of players sit within 0.0167 × range of another player’s composite',
    scale: 'On 1–10: within 0.15 of someone else’s composite.',
    plain: 'Many players have near-identical composites, so the ranking is separating them by tiny, possibly meaningless margins.',
  },
  {
    title: 'Relative age effect',
    when: 'more than 50% of the top third of the ranking were born in birth-quarter 1 (~25% expected by chance)',
    scale: 'Only runs when a birth-date column is mapped.',
    plain: 'The top of the ranking is dominated by players born early in the selection year — older and more physically mature at this age, not necessarily more able.',
  },
];

function CheckCard({ c, tone }: { c: Check; tone: 'danger' | 'warning' }) {
  return (
    <div className={`flag flag--${tone}`}>
      <span className={`chip chip--${tone}`}>{tone === 'danger' ? 'Data integrity' : 'Signal'}</span>
      <h3 className="flag__title">{c.title}</h3>
      <div className="mono body-sm" style={{ marginTop: 10, color: 'var(--fg)' }}>When it fires: {c.when}</div>
      <div className="body-sm subtle" style={{ marginTop: 4 }}>{c.scale}</div>
      <p className="flag__plain" style={{ marginTop: 10 }}>{c.plain}</p>
    </div>
  );
}

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div style={{ marginBottom: 'var(--s-4)' }}>
      <div className="eyebrow">{kicker}</div>
      <h2 className="title-lg" style={{ marginTop: 8 }}>{title}</h2>
    </div>
  );
}

export default function MethodologyPage() {
  return (
    <div className="container container--narrow" style={{ padding: 'var(--s-10) var(--s-5) var(--s-20)' }}>
      <div className="grid gap-8">
        {/* Header */}
        <header className="grid gap-3">
          <Link href="/" className="nav-link" style={{ width: 'fit-content', paddingLeft: 0 }}>← Back to home</Link>
          <div className="eyebrow">Methodology</div>
          <h1 className="display">Exactly what {PRODUCT_NAME} checks, and how.</h1>
          <p className="body-base muted">
            {PRODUCT_NAME} reads your evaluation file in your browser — nothing is uploaded or stored —
            and runs two families of checks plus a coverage map over it. Every threshold below is a
            range-relative default, scaled to your own rubric, and is meant to be calibrated against a
            real evaluator file later. Nothing here judges whether a subjective score is correct.
          </p>
        </header>

        {/* Inputs */}
        <section>
          <SectionHead kicker="Step 1 · Inputs" title="What goes in, and how it’s set up" />
          <div className="card card--pad grid gap-4">
            <div>
              <div className="title-md" style={{ fontSize: 'var(--text-base)' }}>The rating scale</div>
              <p className="body-sm muted" style={{ marginTop: 4 }}>
                A minimum and maximum (default <span className="mono">1–10</span>). Everything range-relative
                below is scaled to <span className="mono">range = max − min</span> and{' '}
                <span className="mono">midpoint = (min + max) / 2</span>.
              </p>
            </div>
            <div>
              <div className="title-md" style={{ fontSize: 'var(--text-base)' }}>The five dimensions</div>
              <ul className="body-sm muted" style={{ marginTop: 6, paddingLeft: 18 }}>
                {CORNERS.map(c => (
                  <li key={c.id} style={{ marginTop: 4 }}><strong>{c.label}</strong> — {c.blurb}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="title-md" style={{ fontSize: 'var(--text-base)' }}>Weights (optional)</div>
              <p className="body-sm muted" style={{ marginTop: 4 }}>
                Off by default — the composite is a simple average. Turn weights on and the
                weight-sum check runs; leave them off and your weighting stays private.
              </p>
            </div>
            <div>
              <div className="title-md" style={{ fontSize: 'var(--text-base)' }}>Birth date &amp; stored result (optional)</div>
              <p className="body-sm muted" style={{ marginTop: 4 }}>
                A birth date is bucketed into a quarter by calendar month (Jan–Mar = Q1 … Oct–Dec = Q4;
                cutoff assumed 1 Jan) and unlocks the relative-age check. A stored overall score unlocks
                the formula-match check. Map neither, and those two checks are simply skipped.
              </p>
            </div>
          </div>
        </section>

        {/* Composite calculation */}
        <section>
          <SectionHead kicker="Step 2 · Calculation" title="How a composite is built" />
          <div className="card card--pad grid gap-3">
            <p className="body-base muted">
              For each player, the composite is the average of the dimension scores that are present:
            </p>
            <div className="mono body-sm" style={{ background: 'var(--bg-elev-2)', padding: 'var(--s-4)', borderRadius: 'var(--r-md)' }}>
              composite = Σ(score × weight) / Σ(weight)&nbsp;&nbsp;— over the dimensions actually scored
            </div>
            <p className="body-sm muted">
              Unweighted, every weight is 1, so it’s a plain average. Blank dimensions are left out and
              the average is renormalised over whatever <em>was</em> scored — which is also why blank
              scores are flagged: a composite over fewer inputs isn’t comparing like with like.
            </p>
          </div>
        </section>

        {/* Integrity checks */}
        <section>
          <SectionHead kicker="Step 3 · Data integrity" title="Is the file internally sound?" />
          <p className="body-sm muted" style={{ margin: '0 0 var(--s-4)' }}>
            Objective defects in how the spreadsheet is built. Each is a yes/no test on the data itself.
          </p>
          <div className="grid gap-3">
            {INTEGRITY.map(c => <CheckCard key={c.title} c={c} tone="danger" />)}
          </div>
        </section>

        {/* Hygiene checks */}
        <section>
          <SectionHead kicker="Step 4 · Scoring hygiene" title="Patterns known to bias rankings" />
          <p className="body-sm muted" style={{ margin: '0 0 var(--s-4)' }}>
            These are signals, not errors — questions to raise with the evaluator. Thresholds are
            range-relative, with the 1–10 equivalents shown.
          </p>
          <div className="grid gap-3">
            {HYGIENE.map(c => <CheckCard key={c.title} c={c} tone="warning" />)}
          </div>
        </section>

        {/* Coverage + ranking */}
        <section>
          <SectionHead kicker="Step 5 · Coverage &amp; ranking" title="What was measured, and the cut" />
          <div className="card card--pad grid gap-3">
            <p className="body-sm muted">
              <strong>Coverage</strong> marks each of the five dimensions as measured or not, and shows
              its weight when weights are on. Any dimension the rubric never scored is called out — per
              the four-corner model, those are whole parts of the player the ranking can’t see.
            </p>
            <p className="body-sm muted">
              <strong>Ranking</strong> sorts players by composite, highest first; a player with no usable
              scores sorts last. <strong>Per player</strong>, the report breaks the composite back down
              into the individual scores and weights it was built from — so any number can be traced to
              its inputs.
            </p>
          </div>
        </section>

        {/* Limits */}
        <section className="claim">
          <div className="eyebrow">The limit, stated plainly</div>
          <p className="body-base" style={{ marginTop: 'var(--s-3)', lineHeight: 'var(--leading-body)' }}>
            Every check above is about consistency, completeness and known bias patterns — never about
            whether a given score is <em>right</em>. Feed {PRODUCT_NAME} biased inputs and it will
            faithfully report a consistent, well-formed, biased ranking. The value is legibility. The
            evaluator still owns the cut.
          </p>
        </section>

        <Link href="/" className="btn btn--ghost" style={{ width: 'fit-content' }}>← Back to home</Link>
      </div>
    </div>
  );
}
