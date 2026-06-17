'use client';

import { CORNERS, DimConfig, Evaluation, PlayerRow } from '@/lib/analysis';

type RankedPlayer = PlayerRow & { composite: number | null; rank: number };

export function PlayerDrilldown({
  player,
  ev,
}: {
  player: RankedPlayer;
  ev: Evaluation;
}) {
  const { dims, scaleMin, scaleMax, weighted } = ev;
  const range = (scaleMax - scaleMin) || 1;
  const unmeasured = CORNERS.filter(c => !dims.some(d => d.id === c.id));
  const compStr = player.composite != null ? player.composite.toFixed(2) : '—';

  return (
    <div style={{ padding: 'var(--s-5)' }} className="grid gap-4">
      <div className="eyebrow">{player.name} · per-dimension breakdown</div>

      <div className="grid gap-3">
        {dims.map((d: DimConfig) => {
          const v = player.scores[d.id];
          const pct = v != null ? Math.max(0, Math.min(100, ((v - scaleMin) / range) * 100)) : 0;
          return (
            <div key={d.id} className="dim-row">
              <div className="dim-row__label">
                {d.label}
                {weighted && d.weight != null && (
                  <div className="dim-row__weight">{d.weight}% weight</div>
                )}
              </div>
              <div className="bar"><i style={{ width: `${pct}%` }} /></div>
              <div className="dim-row__val">{v != null ? v : '—'}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-baseline gap-3" style={{ paddingTop: 4 }}>
        <span className="eyebrow">Composite</span>
        <span className="mono" style={{ fontSize: 'var(--text-xl)' }}>{compStr}</span>
        {weighted && <span className="body-sm subtle">weight-blended average</span>}
        {!weighted && <span className="body-sm subtle">simple average</span>}
      </div>

      <div className="result-note">
        {player.name}&rsquo;s composite of {compStr} is the {weighted ? 'weight-blended' : 'simple'} average
        of the scores above. This shows exactly how the number was built — it doesn&rsquo;t tell you
        whether each input score is fair.
      </div>

      {unmeasured.length > 0 && (
        <div className="body-sm subtle">
          Not measured for this player: {unmeasured.map(u => u.label).join(', ')}.
        </div>
      )}
    </div>
  );
}
