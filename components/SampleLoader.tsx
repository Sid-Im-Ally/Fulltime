'use client';

import { SAMPLES } from '@/lib/samples';
import { Evaluation } from '@/lib/analysis';

export function SampleLoader({ onLoad }: { onLoad: (ev: Evaluation, label: string) => void }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 'var(--s-3)' }}>No file handy?</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {SAMPLES.map(s => (
          <button
            key={s.id}
            type="button"
            className="card card--pad"
            style={{ textAlign: 'left', cursor: 'pointer' }}
            onClick={() => onLoad(s.build(), s.label)}
          >
            <div className="title-md">{s.label}</div>
            <div className="body-sm muted" style={{ marginTop: 6 }}>{s.description}</div>
            <div className="chip chip--primary" style={{ marginTop: 'var(--s-3)' }}>Load sample →</div>
          </button>
        ))}
      </div>
    </div>
  );
}
