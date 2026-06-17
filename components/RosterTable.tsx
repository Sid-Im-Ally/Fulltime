'use client';

import { Fragment, useState } from 'react';
import { Evaluation, Report } from '@/lib/analysis';
import { PlayerDrilldown } from './PlayerDrilldown';

export function RosterTable({ report, ev }: { report: Report; ev: Evaluation }) {
  const [open, setOpen] = useState<number | null>(null);
  const { dims, hasBirthData } = ev;
  const toggle = (i: number) => setOpen(o => (o === i ? null : i));
  const colSpan = 2 + (hasBirthData ? 1 : 0) + dims.length + 1;

  const birthChip = (q?: number | null) => {
    if (q == null) return <span className="subtle">—</span>;
    return q === 1
      ? <span className="chip chip--primary">Q1</span>
      : <span className="mono">Q{q}</span>;
  };

  return (
    <div className="card card--flush">
      {/* Desktop / print: real table */}
      <div className="show-desktop">
        <table className="roster-table">
          <thead>
            <tr>
              <th style={{ width: 56 }}>#</th>
              <th>Player</th>
              {hasBirthData && <th>Birth Q</th>}
              {dims.map(d => <th key={d.id} className="num">{d.label}</th>)}
              <th className="num">Composite</th>
            </tr>
          </thead>
          <tbody>
            {report.ranked.map((p, i) => (
              <Fragment key={p.name + i}>
                <tr
                  className={`roster-row${open === i ? ' roster-row--open' : ''}`}
                  onClick={() => toggle(i)}
                  tabIndex={0}
                  aria-expanded={open === i}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); } }}
                >
                  <td><span className={`rank-badge${p.rank <= Math.max(1, Math.round(report.ranked.length / 3)) ? ' rank-badge--top' : ''}`}>{p.rank}</span></td>
                  <td><span className="title-md" style={{ fontSize: 'var(--text-base)' }}>{p.name}</span></td>
                  {hasBirthData && <td>{birthChip(p.birthQuarter)}</td>}
                  {dims.map(d => <td key={d.id} className="num">{p.scores[d.id] ?? '—'}</td>)}
                  <td className="num"><strong>{p.composite != null ? p.composite.toFixed(2) : '—'}</strong></td>
                </tr>
                <tr className={`roster-detail${open === i ? ' open' : ''}`}>
                  <td className="roster-detail-cell" colSpan={colSpan}>
                    <PlayerDrilldown player={p} ev={ev} />
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked per-player cards, expandable */}
      <div className="show-mobile">
        {report.ranked.map((p, i) => (
          <div key={p.name + i}>
            <div
              className={`roster-card${open === i ? ' roster-card--open' : ''}`}
              role="button"
              tabIndex={0}
              aria-expanded={open === i}
              onClick={() => toggle(i)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); } }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`rank-badge${p.rank <= Math.max(1, Math.round(report.ranked.length / 3)) ? ' rank-badge--top' : ''}`}>{p.rank}</span>
                  <div>
                    <div className="title-md" style={{ fontSize: 'var(--text-base)' }}>{p.name}</div>
                    {hasBirthData && <div style={{ marginTop: 4 }}>{birthChip(p.birthQuarter)}</div>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 'var(--text-lg)' }}>{p.composite != null ? p.composite.toFixed(2) : '—'}</div>
                  <div className="eyebrow">composite</div>
                </div>
              </div>
            </div>
            {open === i && (
              <div style={{ background: 'var(--bg-elev-2)', borderBottom: '1px solid var(--border-faint)' }}>
                <PlayerDrilldown player={p} ev={ev} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
