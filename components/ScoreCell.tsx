'use client';

import { forwardRef } from 'react';
import { SCALE_MAX, SCALE_MIN } from '@/lib/evaluate';

export type NavDir = 'left' | 'right' | 'up' | 'down';

const VALUES = Array.from({ length: SCALE_MAX - SCALE_MIN + 1 }, (_, i) => SCALE_MIN + i);

/**
 * Compact 1–5 segmented selector for one skill/player. The whole cell is the keyboard
 * unit (one tab stop): number keys score, 0/Backspace clears, arrows move between cells.
 * The five segments stay visible so the evaluator sees the distribution they're creating.
 */
export const ScoreCell = forwardRef<HTMLDivElement, {
  value: number | null;
  onChange: (v: number | null) => void;
  onNav?: (dir: NavDir) => void;
  label: string;
  block?: boolean;        // full-width layout (focus mode / mobile cards)
}>(function ScoreCell({ value, onChange, onNav, label, block = false }, ref) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (k >= String(SCALE_MIN) && k <= String(SCALE_MAX)) {
      e.preventDefault();
      onChange(Number(k));
    } else if (k === '0' || k === 'Backspace' || k === 'Delete') {
      e.preventDefault();
      onChange(null);
    } else if (k === 'ArrowLeft') { e.preventDefault(); onNav?.('left'); }
    else if (k === 'ArrowRight') { e.preventDefault(); onNav?.('right'); }
    else if (k === 'ArrowUp') { e.preventDefault(); onNav?.('up'); }
    else if (k === 'ArrowDown') { e.preventDefault(); onNav?.('down'); }
  };

  return (
    <div
      ref={ref}
      role="group"
      aria-label={`${label}${value != null ? `, scored ${value} of ${SCALE_MAX}` : ', not scored'}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`scorecell${block ? ' scorecell--block' : ''}`}
    >
      {VALUES.map(n => {
        const selected = value === n;
        return (
          <button
            key={n}
            type="button"
            tabIndex={-1}
            aria-pressed={selected}
            aria-label={`${label}: ${n}`}
            className={`scoreseg${selected ? ' scoreseg--on' : ''}`}
            onClick={() => onChange(selected ? null : n)}
          >
            <span className="mono">{n}</span>
          </button>
        );
      })}
    </div>
  );
});
