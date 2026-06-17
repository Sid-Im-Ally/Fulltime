'use client';

import Link from 'next/link';
import { SAMPLES } from '@/lib/samples';
import { Evaluation } from '@/lib/analysis';

export function SampleLoader({ onLoad }: { onLoad: (ev: Evaluation, label: string) => void }) {
  // Use the richer dataset so the sample actually exercises every check.
  const sample = SAMPLES.find(s => s.id === 'typical') ?? SAMPLES[0];

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 'var(--s-3)' }}>No file to hand?</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          className="card card--pad"
          style={{ textAlign: 'left', cursor: 'pointer' }}
          onClick={() => onLoad(sample.build(), 'Sample evaluation')}
        >
          <div className="title-md">Sample evaluation</div>
          <div className="body-sm muted" style={{ marginTop: 6 }}>
            See a full report run on a realistic evaluation file — the checks, the coverage map and a
            per-player breakdown, with nothing to upload.
          </div>
          <div className="chip chip--primary" style={{ marginTop: 'var(--s-3)' }}>Open sample →</div>
        </button>

        <Link
          href="/methodology"
          className="card card--pad"
          style={{ display: 'block', textAlign: 'left', textDecoration: 'none', color: 'inherit' }}
        >
          <div className="title-md">Methodology</div>
          <div className="body-sm muted" style={{ marginTop: 6 }}>
            The exact process — every metric, calculation and check the report runs, and the
            threshold behind each flag.
          </div>
          <div className="chip" style={{ marginTop: 'var(--s-3)' }}>Read the methodology →</div>
        </Link>
      </div>
    </div>
  );
}
