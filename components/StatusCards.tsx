'use client';

import { Report } from '@/lib/analysis';

export function StatusCards({ report }: { report: Report }) {
  const integrityClean = report.integrityClean;
  const hygieneCount = report.hygiene.length;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="card card--pad statuscard">
        <span className={`dot ${integrityClean ? 'dot--success' : 'dot--danger'}`} style={{ marginTop: 7 }} />
        <div>
          <div className="eyebrow">Structural integrity</div>
          <div className="statuscard__val">{integrityClean ? 'Clean' : report.integrity.length}</div>
          <div className="body-sm muted" style={{ marginTop: 4 }}>
            {integrityClean
              ? 'The spreadsheet is internally sound.'
              : `${report.integrity.length} issue${report.integrity.length > 1 ? 's' : ''} in how the file is built.`}
          </div>
        </div>
      </div>

      <div className="card card--pad statuscard">
        <span className={`dot ${hygieneCount === 0 ? 'dot--success' : 'dot--warning'}`} style={{ marginTop: 7 }} />
        <div>
          <div className="eyebrow">Scoring hygiene</div>
          <div className="statuscard__val">{hygieneCount === 0 ? 'None' : hygieneCount}</div>
          <div className="body-sm muted" style={{ marginTop: 4 }}>
            {hygieneCount === 0
              ? 'No known bias patterns surfaced.'
              : `${hygieneCount} scoring pattern${hygieneCount > 1 ? 's' : ''} worth a second look.`}
          </div>
        </div>
      </div>
    </div>
  );
}
