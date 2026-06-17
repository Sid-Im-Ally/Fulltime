'use client';

import { useMemo, useState } from 'react';
import { analyze, Evaluation } from '@/lib/analysis';
import { ParsedSheet } from '@/lib/parse';
import { UploadDropzone } from '@/components/UploadDropzone';
import { SampleLoader } from '@/components/SampleLoader';
import { ColumnMapper } from '@/components/ColumnMapper';
import { ReportView } from '@/components/ReportView';

type Step =
  | { kind: 'upload' }
  | { kind: 'map'; sheet: ParsedSheet; fileName: string }
  | { kind: 'report'; ev: Evaluation; sourceLabel: string; fromSample: boolean };

export default function Home() {
  const [step, setStep] = useState<Step>({ kind: 'upload' });

  const report = useMemo(
    () => (step.kind === 'report' ? analyze(step.ev) : null),
    [step]
  );

  return (
    <div className="container" style={{ padding: 'var(--s-10) var(--s-5) var(--s-20)' }}>
      {step.kind === 'upload' && (
        <div className="grid gap-8" style={{ maxWidth: 760, margin: '0 auto' }}>
          <header className="grid gap-3">
            <div className="eyebrow">Evaluation transparency · for clubs &amp; coaches</div>
            <h1 className="display">Show the work behind a player&rsquo;s ranking.</h1>
            <p className="body-base muted" style={{ maxWidth: 620 }}>
              Upload the spreadsheet you use to score and rank players. We run consistency, data
              integrity and coverage checks and produce a transparency report — including a per-player breakdown
              of how each result was built. It doesn&rsquo;t judge whether a score is correct; it shows
              what can be checked.
            </p>
          </header>

          <UploadDropzone
            onParsed={(sheet, fileName) => setStep({ kind: 'map', sheet, fileName })}
          />

          <div style={{ borderTop: '1px solid var(--border-faint)', paddingTop: 'var(--s-6)' }}>
            <SampleLoader
              onLoad={(ev, label) => setStep({ kind: 'report', ev, sourceLabel: label, fromSample: true })}
            />
          </div>
        </div>
      )}

      {step.kind === 'map' && (
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <ColumnMapper
            sheet={step.sheet}
            fileName={step.fileName}
            onBack={() => setStep({ kind: 'upload' })}
            onRun={ev => setStep({ kind: 'report', ev, sourceLabel: step.fileName, fromSample: false })}
          />
        </div>
      )}

      {step.kind === 'report' && report && (
        <ReportView
          ev={step.ev}
          report={report}
          sourceLabel={step.sourceLabel}
          fromSample={step.fromSample}
          onReset={() => setStep({ kind: 'upload' })}
        />
      )}
    </div>
  );
}
