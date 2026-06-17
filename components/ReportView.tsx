'use client';

import { Evaluation, Report } from '@/lib/analysis';
import { PRODUCT_LABEL, PRODUCT_NAME } from '@/lib/brand';
import { StatusCards } from './StatusCards';
import { FlagCard } from './FlagCard';
import { CoverageMap } from './CoverageMap';
import { RosterTable } from './RosterTable';

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div style={{ marginBottom: 'var(--s-4)' }}>
      <div className="eyebrow">{kicker}</div>
      <h2 className="title-lg" style={{ marginTop: 8 }}>{title}</h2>
    </div>
  );
}

export function ReportView({ ev, report, onReset, sourceLabel }: {
  ev: Evaluation;
  report: Report;
  onReset: () => void;
  sourceLabel: string;
}) {
  return (
    <div className="grid gap-8">
      {/* Header */}
      <header className="grid gap-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="eyebrow">{PRODUCT_LABEL} · transparency report</div>
          <div className="flex gap-2 no-print">
            <button className="btn btn--ghost" onClick={() => window.print()}>Download / print report</button>
            <button className="btn" onClick={onReset}>Check another file</button>
          </div>
        </div>
        <h1 className="display">Evaluation report</h1>
        <p className="body-base muted" style={{ maxWidth: 680 }}>
          Checks an evaluation for consistency, integrity and coverage — and shows the basis for
          each player&rsquo;s result. It does not judge whether a score is correct.
        </p>
        <p className="body-sm subtle mono">{sourceLabel} · {ev.players.length} players · {ev.dims.length} dimensions · scale {ev.scaleMin}–{ev.scaleMax}</p>
      </header>

      <StatusCards report={report} />

      {/* Integrity */}
      <section>
        <SectionHead kicker="Structural integrity" title="Is the spreadsheet internally sound?" />
        {report.integrity.length === 0 ? (
          <div className="note note--success">
            <span className="dot dot--success" style={{ marginTop: 5 }} />
            <span>No structural problems. Weights, composites, scale bounds and completeness all check out.</span>
          </div>
        ) : (
          <div className="grid gap-3">
            {report.integrity.map((f, i) => <FlagCard key={i} flag={f} />)}
          </div>
        )}
      </section>

      {/* Hygiene */}
      <section>
        <SectionHead kicker="Scoring hygiene" title="Patterns known to bias rankings" />
        {report.hygiene.length === 0 ? (
          <div className="note note--success">
            <span className="dot dot--success" style={{ marginTop: 5 }} />
            <span>No known bias patterns surfaced in how the scores were distributed.</span>
          </div>
        ) : (
          <div className="grid gap-3">
            {report.hygiene.map((f, i) => <FlagCard key={i} flag={f} />)}
          </div>
        )}
      </section>

      {/* Coverage */}
      <section>
        <SectionHead kicker="Coverage" title="What the rubric did and didn’t measure" />
        <CoverageMap report={report} weighted={ev.weighted} />
      </section>

      {/* Roster */}
      <section>
        <SectionHead kicker="Ranking" title="The roster, and how each composite was built" />
        <p className="body-sm muted no-print" style={{ margin: '0 0 var(--s-4)' }}>
          Click any player to see their per-dimension breakdown.
        </p>
        <RosterTable report={report} ev={ev} />
      </section>

      {/* Claim box */}
      <section className="claim">
        <div className="eyebrow">What {PRODUCT_NAME} claims, precisely</div>
        <p className="body-base" style={{ marginTop: 'var(--s-3)', lineHeight: 'var(--leading-body)' }}>
          It verifies the spreadsheet is internally sound, flags scoring patterns that are known
          sources of bias, shows what the rubric did and didn&rsquo;t measure, and gives a
          per-dimension breakdown for every player. It cannot validate that a subjective score is
          correct — feed it
          biased inputs and it will faithfully report a consistent, well-formed, biased ranking. The
          value is legibility. The human still owns the cut.
        </p>
      </section>
    </div>
  );
}
