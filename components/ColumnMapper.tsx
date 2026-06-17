'use client';

import { useMemo, useState } from 'react';
import { CORNERS, DimId, Evaluation } from '@/lib/analysis';
import { buildEvaluation, ColumnRole, guessMapping, ParsedSheet, ROLE_OPTIONS } from '@/lib/parse';

const DIM_IDS = CORNERS.map(c => c.id) as DimId[];

export function ColumnMapper({
  sheet,
  fileName,
  onRun,
  onBack,
}: {
  sheet: ParsedSheet;
  fileName: string;
  onRun: (ev: Evaluation) => void;
  onBack: () => void;
}) {
  const [mapping, setMapping] = useState<Record<string, ColumnRole>>(() => guessMapping(sheet.columns));
  const [scaleMin, setScaleMin] = useState(1);
  const [scaleMax, setScaleMax] = useState(10);
  const [weighted, setWeighted] = useState(false);
  const [weights, setWeights] = useState<Partial<Record<DimId, number>>>({});

  const mappedDims = useMemo(
    () => DIM_IDS.filter(id => Object.values(mapping).includes(id)),
    [mapping]
  );
  const hasName = Object.values(mapping).includes('name');
  const hasBirth = Object.values(mapping).includes('birth');
  const canRun = mappedDims.length >= 1;

  const weightSum = mappedDims.reduce((a, id) => a + (Number(weights[id]) || 0), 0);

  const sampleValue = (col: string): string => {
    for (const row of sheet.rows) {
      const v = row[col];
      if (v != null && String(v).trim() !== '') {
        const s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
        return s.length > 22 ? s.slice(0, 22) + '…' : s;
      }
    }
    return '—';
  };

  function setRole(col: string, role: ColumnRole) {
    setMapping(m => ({ ...m, [col]: role }));
  }

  function run() {
    onRun(buildEvaluation(sheet, mapping, { scaleMin, scaleMax, weighted, weights }));
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="eyebrow">Step 2 · Map columns</div>
          <h2 className="title-lg" style={{ marginTop: 8 }}>Tell us what each column is</h2>
          <p className="body-sm muted" style={{ marginTop: 6, maxWidth: 560 }}>
            We guessed from your headers — correct anything that&rsquo;s off.{' '}
            <span className="mono">{fileName}</span> · {sheet.rows.length} players · {sheet.columns.length} columns.
          </p>
        </div>
        <button className="btn btn--ghost no-print" onClick={onBack}>← Different file</button>
      </div>

      {/* Column → role mapping */}
      <div className="card card--flush">
        {sheet.columns.map((col, i) => (
          <div
            key={col}
            className="grid items-center gap-3 sm:grid-cols-[1fr_auto]"
            style={{ padding: 'var(--s-4)', borderBottom: i < sheet.columns.length - 1 ? '1px solid var(--border-faint)' : undefined }}
          >
            <div>
              <div className="title-md" style={{ fontSize: 'var(--text-base)' }}>{col}</div>
              <div className="body-sm subtle mono" style={{ marginTop: 2 }}>e.g. {sampleValue(col)}</div>
            </div>
            <div>
              <label className="sr-only" htmlFor={`map-${i}`}>Role for column {col}</label>
              <select
                id={`map-${i}`}
                className="select"
                style={{ minWidth: 200 }}
                value={mapping[col]}
                onChange={e => setRole(col, e.target.value as ColumnRole)}
              >
                {ROLE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Scale + weights */}
      <div className="card card--pad grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2" style={{ maxWidth: 420 }}>
          <div>
            <label className="label" htmlFor="scale-min">Scale minimum</label>
            <input id="scale-min" className="input input--mono" type="number" value={scaleMin}
              onChange={e => setScaleMin(Number(e.target.value))} />
          </div>
          <div>
            <label className="label" htmlFor="scale-max">Scale maximum</label>
            <input id="scale-max" className="input input--mono" type="number" value={scaleMax}
              onChange={e => setScaleMax(Number(e.target.value))} />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-3" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={weighted} onChange={e => setWeighted(e.target.checked)} />
            <span className="body-base">I want to enter weights</span>
          </label>
          <p className="body-sm subtle" style={{ marginTop: 6 }}>
            Off by default — composites are a simple average. Turn on only if your rubric weights the
            dimensions, and we&rsquo;ll check the weights sum to 100.
          </p>
        </div>

        {weighted && mappedDims.length > 0 && (
          <div className="grid gap-3">
            {mappedDims.map(id => {
              const corner = CORNERS.find(c => c.id === id)!;
              return (
                <div key={id} className="grid items-center gap-3" style={{ gridTemplateColumns: '1fr 120px' }}>
                  <label className="body-base" htmlFor={`w-${id}`}>{corner.label}</label>
                  <input
                    id={`w-${id}`}
                    className="input input--mono"
                    type="number"
                    inputMode="decimal"
                    value={weights[id] ?? ''}
                    placeholder="0"
                    onChange={e => setWeights(w => ({ ...w, [id]: e.target.value === '' ? 0 : Number(e.target.value) }))}
                  />
                </div>
              );
            })}
            <div className={`note ${weightSum === 100 ? 'note--success' : 'note--warning'}`}>
              <span className="mono">Σ {weightSum}</span>
              <span>{weightSum === 100 ? 'Weights sum to 100.' : 'Weights don’t sum to 100 — the checks will flag this.'}</span>
            </div>
          </div>
        )}
      </div>

      <p className="body-sm subtle">
        Birth date is bucketed into quarters by calendar month (Jan–Mar = Q1 … Oct–Dec = Q4). The
        selection-year cutoff is assumed Jan 1 and is adjustable later.
        {!hasBirth && ' No birth column mapped, so the relative-age check is skipped.'}
      </p>

      {!hasName && (
        <div className="note note--neutral">No <strong>Player name</strong> column mapped — players will be labelled Player 1, Player 2, …</div>
      )}

      <div className="flex items-center gap-3">
        <button className="btn btn--primary" disabled={!canRun} onClick={run}>Run checks →</button>
        {!canRun && <span className="body-sm subtle">Map at least one scoring dimension to continue.</span>}
      </div>
    </div>
  );
}
