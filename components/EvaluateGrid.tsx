'use client';

import { useRef, useState } from 'react';
import { PlayerEntry, RankedEntry, SCALE_MAX, Skill, SkillId } from '@/lib/evaluate';
import { ScoreCell, NavDir } from './ScoreCell';

interface GridProps {
  entries: PlayerEntry[];
  skills: Skill[];
  ranked: RankedEntry[];
  showBirth: boolean;
  onScore: (entryId: string, skillId: SkillId, v: number | null) => void;
  onName: (entryId: string, name: string) => void;
  onBirth: (entryId: string, birth: string | null) => void;
  onNotes: (entryId: string, notes: string) => void;
  onRemove: (entryId: string) => void;
}

function AnchorsHelp({ skill }: { skill: Skill }) {
  return (
    <div className="anchors">
      <div className="anchors__title">{skill.label} — what each rating looks like</div>
      <ul className="anchors__list">
        <li><span className="anchors__n mono">1</span><span>{skill.anchors.low}</span></li>
        <li><span className="anchors__n mono">3</span><span>{skill.anchors.mid}</span></li>
        <li><span className="anchors__n mono">5</span><span>{skill.anchors.high}</span></li>
      </ul>
      <p className="anchors__between">2 and 4 are “between” levels.</p>
    </div>
  );
}

export function EvaluateGrid(props: GridProps) {
  const { entries, skills, ranked, showBirth } = props;
  const [openAnchor, setOpenAnchor] = useState<SkillId | null>(null);

  const overallById = new Map(ranked.map(r => [r.entry.id, r]));
  const topThird = Math.max(1, Math.round(entries.filter(e => overallById.get(e.id)?.overall != null).length / 3));

  // Roving focus across score cells: refs keyed `${row}:${col}`.
  const cellRefs = useRef(new Map<string, HTMLDivElement | null>());
  const key = (r: number, c: number) => `${r}:${c}`;
  const focusCell = (r: number, c: number) => {
    const el = cellRefs.current.get(key(r, c));
    if (el) el.focus();
  };
  const nav = (r: number, c: number, dir: NavDir) => {
    const maxR = entries.length - 1, maxC = skills.length - 1;
    if (dir === 'left') focusCell(r, Math.max(0, c - 1));
    else if (dir === 'right') focusCell(r, Math.min(maxC, c + 1));
    else if (dir === 'up') focusCell(Math.max(0, r - 1), c);
    else if (dir === 'down') focusCell(Math.min(maxR, r + 1), c);
  };

  const overallCell = (entryId: string) => {
    const r = overallById.get(entryId);
    const o = r?.overall;
    return (
      <div className="ov">
        <span className="mono ov__num">{o != null ? o.toFixed(2) : '—'}</span>
        {r?.rank != null
          ? <span className={`rank-badge${r.rank <= topThird ? ' rank-badge--top' : ''}`}>{r.rank}</span>
          : <span className="ov__unranked">unranked</span>}
      </div>
    );
  };

  return (
    <>
      {openAnchor && (
        <div className="card card--pad no-print" style={{ marginBottom: 'var(--s-4)' }}>
          <div className="flex items-start justify-between gap-3">
            <AnchorsHelp skill={skills.find(s => s.id === openAnchor)!} />
            <button className="btn btn--ghost" onClick={() => setOpenAnchor(null)} aria-label="Close anchors">Close</button>
          </div>
        </div>
      )}

      {/* Desktop: scrollable grid */}
      <div className="show-desktop">
        <div className="card card--flush eval-scroll">
          <table className="eval-table">
            <thead>
              <tr>
                <th className="eval-th--rank">#</th>
                <th className="eval-th--name">Player</th>
                {showBirth && <th className="eval-th--birth">Birth date</th>}
                {skills.map(s => (
                  <th key={s.id} className="eval-th--skill">
                    <button
                      type="button"
                      className="skill-head"
                      aria-expanded={openAnchor === s.id}
                      onClick={() => setOpenAnchor(o => (o === s.id ? null : s.id))}
                      title="Show rating anchors"
                    >
                      <span>{s.label}</span>
                      <span className="skill-head__hint" aria-hidden>anchors</span>
                    </button>
                  </th>
                ))}
                <th className="eval-th--ov num">Overall · Rank</th>
                <th className="eval-th--notes">Notes</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, r) => (
                <tr key={entry.id}>
                  <td className="num">
                    {(() => {
                      const rk = overallById.get(entry.id)?.rank;
                      return rk != null
                        ? <span className={`rank-badge${rk <= topThird ? ' rank-badge--top' : ''}`}>{rk}</span>
                        : <span className="subtle mono">—</span>;
                    })()}
                  </td>
                  <td className="eval-td--name">
                    <div className="flex items-center gap-2">
                      <input
                        className="input input--bare"
                        value={entry.name}
                        aria-label={`Player ${r + 1} name`}
                        placeholder="Name"
                        onChange={e => props.onName(entry.id, e.target.value)}
                      />
                      <button className="icon-btn no-print" aria-label={`Remove ${entry.name || 'player'}`}
                        onClick={() => props.onRemove(entry.id)} title="Remove player">×</button>
                    </div>
                  </td>
                  {showBirth && (
                    <td>
                      <input
                        type="date"
                        className="input input--bare input--mono"
                        aria-label={`${entry.name || `Player ${r + 1}`} birth date`}
                        value={entry.birth ?? ''}
                        onChange={e => props.onBirth(entry.id, e.target.value || null)}
                      />
                    </td>
                  )}
                  {skills.map((s, c) => (
                    <td key={s.id}>
                      <ScoreCell
                        ref={el => { cellRefs.current.set(key(r, c), el); }}
                        label={`${s.label} for ${entry.name || `player ${r + 1}`}`}
                        value={entry.scores[s.id] ?? null}
                        onChange={v => props.onScore(entry.id, s.id, v)}
                        onNav={dir => nav(r, c, dir)}
                      />
                    </td>
                  ))}
                  <td className="num">{overallCell(entry.id)}</td>
                  <td className="eval-td--notes">
                    <textarea
                      className="input input--bare eval-notes"
                      rows={1}
                      value={entry.notes}
                      aria-label={`Notes for ${entry.name || `player ${r + 1}`}`}
                      placeholder="What stood out…"
                      onChange={e => props.onNotes(entry.id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && <div className="empty-note">Add players to start scoring.</div>}
        </div>
      </div>

      {/* Mobile: one expandable card per player */}
      <div className="show-mobile grid gap-3">
        {entries.map((entry, r) => (
          <MobilePlayerCard
            key={entry.id}
            entry={entry}
            index={r}
            skills={skills}
            showBirth={showBirth}
            overall={overallCell(entry.id)}
            onScore={props.onScore}
            onName={props.onName}
            onBirth={props.onBirth}
            onNotes={props.onNotes}
            onRemove={props.onRemove}
            onAnchors={setOpenAnchor}
          />
        ))}
        {entries.length === 0 && <div className="empty-note">Add players to start scoring.</div>}
      </div>
    </>
  );
}

function MobilePlayerCard({
  entry, index, skills, showBirth, overall, onScore, onName, onBirth, onNotes, onRemove, onAnchors,
}: {
  entry: PlayerEntry;
  index: number;
  skills: Skill[];
  showBirth: boolean;
  overall: React.ReactNode;
  onScore: GridProps['onScore'];
  onName: GridProps['onName'];
  onBirth: GridProps['onBirth'];
  onNotes: GridProps['onNotes'];
  onRemove: GridProps['onRemove'];
  onAnchors: (id: SkillId) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card card--pad">
      <div className="flex items-center justify-between gap-3" style={{ marginBottom: open ? 'var(--s-4)' : 0 }}>
        <div className="flex-1">
          <input
            className="input input--bare"
            value={entry.name}
            aria-label={`Player ${index + 1} name`}
            placeholder="Name"
            onChange={e => onName(entry.id, e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {overall}
          <button className="icon-btn" aria-label={`Remove ${entry.name || 'player'}`} onClick={() => onRemove(entry.id)}>×</button>
          <button className="icon-btn" aria-expanded={open} aria-label={open ? 'Collapse' : 'Expand'}
            onClick={() => setOpen(o => !o)}>{open ? '▾' : '▸'}</button>
        </div>
      </div>
      {open && (
        <div className="grid gap-3">
          {showBirth && (
            <label className="grid gap-1">
              <span className="label" style={{ margin: 0 }}>Birth date</span>
              <input type="date" className="input input--mono" value={entry.birth ?? ''}
                onChange={e => onBirth(entry.id, e.target.value || null)} />
            </label>
          )}
          {skills.map(s => (
            <div key={s.id} className="m-skill">
              <div className="flex items-center justify-between gap-2">
                <span className="dim-row__label">{s.label}</span>
                <button type="button" className="skill-head__hint skill-head__hint--btn"
                  onClick={() => onAnchors(s.id)}>anchors</button>
              </div>
              <ScoreCell
                block
                label={`${s.label} for ${entry.name || `player ${index + 1}`}`}
                value={entry.scores[s.id] ?? null}
                onChange={v => onScore(entry.id, s.id, v)}
              />
            </div>
          ))}
          <label className="grid gap-1">
            <span className="label" style={{ margin: 0 }}>Notes</span>
            <textarea
              className="input eval-notes"
              rows={2}
              style={{ padding: 10 }}
              value={entry.notes}
              aria-label={`Notes for ${entry.name || `player ${index + 1}`}`}
              placeholder="What stood out…"
              onChange={e => onNotes(entry.id, e.target.value)}
            />
          </label>
          <p className="body-sm subtle" style={{ margin: 0 }}>Tap “anchors” on any skill for the 1 / 3 / 5 guide. Score {SCALE_MAX} = strongest.</p>
        </div>
      )}
    </div>
  );
}
