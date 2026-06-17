'use client';

import { useRef, useState } from 'react';
import { readWorkbook, ParsedSheet } from '@/lib/parse';

export function UploadDropzone({ onParsed }: { onParsed: (sheet: ParsedSheet, fileName: string) => void }) {
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const sheet = await readWorkbook(file);
      if (!sheet.columns.length || !sheet.rows.length) {
        setError('That file has no readable rows. Check it has a header row and at least one player.');
        return;
      }
      onParsed(sheet, file.name);
    } catch {
      setError('Could not read that file. Supported formats: .xlsx, .xls, .csv');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div
        className={`dropzone${over ? ' dropzone--over' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Upload an evaluation spreadsheet"
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); handleFile(e.dataTransfer.files?.[0]); }}
      >
        <div className="dropzone__icon" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
            <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
        </div>
        <div className="title-md">{busy ? 'Reading…' : 'Drop your evaluation file here'}</div>
        <div className="body-sm muted" style={{ marginTop: 6 }}>
          or click to choose — .xlsx, .xls or .csv
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="sr-only"
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
          onChange={e => handleFile(e.target.files?.[0])}
        />
      </div>

      {error && (
        <div className="note note--warning" style={{ marginTop: 'var(--s-3)' }} role="alert">
          {error}
        </div>
      )}

      <div className="privacy-line" style={{ marginTop: 'var(--s-4)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        Your file is read in your browser and never uploaded. We store nothing.
      </div>
    </div>
  );
}
