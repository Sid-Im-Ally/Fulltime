'use client';

import { Report } from '@/lib/analysis';

export function CoverageMap({ report, weighted }: { report: Report; weighted: boolean }) {
  return (
    <div className="card card--pad">
      <div className="grid">
        {report.coverage.map(c => (
          <div key={c.id} className="coverage-row">
            <div>
              <div className="title-md" style={{ fontSize: 'var(--text-base)' }}>{c.label}</div>
              <div className="body-sm subtle" style={{ marginTop: 2 }}>{c.blurb}</div>
            </div>
            <div>
              {c.measured ? (
                weighted && c.weight != null ? (
                  <div className="bar"><i style={{ width: `${Math.min(100, c.weight)}%` }} /></div>
                ) : (
                  <div className="bar bar--success"><i style={{ width: '100%' }} /></div>
                )
              ) : (
                <div className="bar"><i style={{ width: '0%' }} /></div>
              )}
            </div>
            <div style={{ minWidth: 110, textAlign: 'right' }}>
              {c.measured ? (
                weighted && c.weight != null ? (
                  <span className="mono body-sm">{c.weight}% weight</span>
                ) : (
                  <span className="chip chip--success">Measured</span>
                )
              ) : (
                <span className="chip chip--warning">Not measured</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {report.gaps.length > 0 && (
        <div className="note note--warning" style={{ marginTop: 'var(--s-5)' }}>
          <span>
            This evaluation never scored {report.gaps.map(g => g.label).join(', ')}. Per the FA
            four-corner model, those are full dimensions of the player — so the ranking reflects only
            part of the game.
          </span>
        </div>
      )}
    </div>
  );
}
