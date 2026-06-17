'use client';

import { Flag } from '@/lib/analysis';

export function FlagCard({ flag }: { flag: Flag }) {
  const isIntegrity = flag.kind === 'integrity';
  return (
    <div className={`flag ${isIntegrity ? 'flag--danger' : 'flag--warning'}`}>
      <span className={`chip ${isIntegrity ? 'chip--danger' : 'chip--warning'}`}>
        {isIntegrity ? 'Integrity' : 'Signal'}
      </span>
      <h3 className="flag__title">{flag.title}</h3>
      {flag.plain && <p className="flag__plain">{flag.plain}</p>}
      <p className="flag__evidence">{flag.evidence}</p>
      {!isIntegrity && (
        <p className="flag__caveat">— a question to raise with the evaluator, not proof of an error.</p>
      )}
    </div>
  );
}
