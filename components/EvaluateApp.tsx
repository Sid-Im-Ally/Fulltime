'use client';

import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { analyze } from '@/lib/analysis';
import {
  PlayerEntry, SkillId, Weights, activeSkills, laMasiaPlayers, newPlayer,
  rankEntries, toEvaluation, weightSum, SCALE_MAX,
} from '@/lib/evaluate';
import { ReportView } from './ReportView';
import { EvaluateGrid } from './EvaluateGrid';

export function EvaluateApp() {
  const [entries, setEntries] = useState<PlayerEntry[]>([]);
  const [includeOptional, setIncludeOptional] = useState(false);
  const [weighted, setWeighted] = useState(false);
  const [weights, setWeights] = useState<Weights>({});
  const [showBirth, setShowBirth] = useState(false);
  const [showWeights, setShowWeights] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [pasteDraft, setPasteDraft] = useState('');
  const [isSample, setIsSample] = useState(false);
  const [checked, setChecked] = useState(false);

  const skills = useMemo(() => activeSkills(includeOptional), [includeOptional]);
  const ranked = useMemo(
    () => rankEntries(entries, skills, weighted, weights),
    [entries, skills, weighted, weights],
  );
  const wSum = useMemo(() => weightSum(skills, weights), [skills, weights]);

  /* —— mutations —— */
  const addOne = (name: string) => {
    const n = name.trim();
    if (!n) return;
    setEntries(es => [...es, newPlayer(n)]);
    setIsSample(false);
  };
  const addPasted = () => {
    const names = pasteDraft.split('\n').map(s => s.trim()).filter(Boolean);
    if (!names.length) return;
    setEntries(es => [...es, ...names.map(newPlayer)]);
    setPasteDraft(''); setShowPaste(false); setIsSample(false);
  };
  const score = (id: string, skill: SkillId, v: number | null) =>
    setEntries(es => es.map(e => (e.id === id ? { ...e, scores: { ...e.scores, [skill]: v } } : e)));
  const rename = (id: string, name: string) =>
    setEntries(es => es.map(e => (e.id === id ? { ...e, name } : e)));
  const setBirth = (id: string, birth: string | null) =>
    setEntries(es => es.map(e => (e.id === id ? { ...e, birth } : e)));
  const setNotes = (id: string, notes: string) =>
    setEntries(es => es.map(e => (e.id === id ? { ...e, notes } : e)));
  const remove = (id: string) => setEntries(es => es.filter(e => e.id !== id));
  const clearAll = () => { setEntries([]); setIsSample(false); };

  const loadSample = () => {
    setEntries(laMasiaPlayers());
    setIncludeOptional(true);
    setShowBirth(true);
    setWeighted(false);
    setIsSample(true);
    setChecked(false);
  };

  const enableWeights = (on: boolean) => {
    setWeighted(on);
    setShowWeights(on);
    if (on) {
      // Seed any unset weights to an even split so the sum starts legible.
      setWeights(w => {
        const next = { ...w };
        const even = Math.round((100 / skills.length) * 10) / 10;
        for (const s of skills) if (next[s.id] == null) next[s.id] = even;
        return next;
      });
    }
  };

  /* —— export —— */
  const exportXlsx = () => {
    const header = ['Rank', 'Player', ...(showBirth ? ['Birth date'] : []),
      ...skills.map(s => s.label), 'Overall', 'Notes'];
    const ordered = [...ranked].sort((a, b) => {
      if (a.rank == null) return 1;
      if (b.rank == null) return -1;
      return a.rank - b.rank;
    });
    const rows = ordered.map(r => {
      const e = r.entry;
      return [
        r.rank ?? '',
        e.name || 'Unnamed',
        ...(showBirth ? [e.birth ?? ''] : []),
        ...skills.map(s => e.scores[s.id] ?? ''),
        r.overall != null ? Number(r.overall.toFixed(2)) : '',
        e.notes,
      ];
    });
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Evaluation');
    XLSX.writeFile(wb, 'full-time-evaluation.xlsx');
  };

  const hasAnyScore = entries.some(e => Object.values(e.scores).some(v => v != null));

  /* —— the loop: build the Evaluation and run the existing analyzer —— */
  if (checked) {
    const ev = toEvaluation(entries, includeOptional, weighted, weights);
    const report = analyze(ev);
    return (
      <div className="eval-wrap" style={{ padding: 'var(--s-10) var(--s-5) var(--s-20)' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          {isSample && (
            <div className="note note--neutral no-print" style={{ marginBottom: 'var(--s-5)' }}>
              <span>Illustrative example — not real player data.</span>
            </div>
          )}
          <ReportView
            ev={ev}
            report={report}
            sourceLabel={isSample ? 'La Masia (illustrative example)' : 'Your evaluation'}
            backLabel="← Back to scoring"
            onReset={() => setChecked(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="eval-wrap" style={{ padding: 'var(--s-10) var(--s-5) var(--s-20)' }}>
      <div className="grid gap-8">
        {/* Header */}
        <header className="grid gap-3" style={{ maxWidth: 760 }}>
          <div className="eyebrow">Evaluate · score players in the app</div>
          <h1 className="display">Score and rank a roster, with the work shown.</h1>
          <p className="body-base muted">
            Score players against observable skills, with a behavioral guide for each rating. Ranks
            update as you go. The tool structures and checks the evaluation — it doesn’t make the
            judgment for you. Your eyes still set each score.
          </p>
          <p className="privacy-line">
            <span className="dot dot--neutral" />
            Scores stay in your browser for this session. Export to keep them.
          </p>
        </header>

        {isSample && (
          <div className="card card--pad" style={{ borderLeft: '3px solid var(--primary)' }}>
            <div className="eyebrow" style={{ color: 'var(--primary)' }}>Illustrative example — not real player data</div>
            <p className="body-base" style={{ margin: 'var(--s-3) 0 0', maxWidth: 760 }}>
              How the best academies score. Programs like FC Barcelona’s La Masia prize technique and
              game intelligence — first touch, passing, decision-making — over who is biggest or
              fastest at a young age. Physical maturity evens out; technical habits and reading the
              game are what last. This sample shows that emphasis — notice the small, technical
              midfielder ranking at the top despite a modest endurance score.
            </p>
          </div>
        )}

        {/* Add players */}
        <section className="card card--pad grid gap-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
            <label className="grid gap-1">
              <span className="label" style={{ margin: 0 }}>Add player</span>
              <input
                className="input"
                value={nameDraft}
                placeholder="Type a name and press Enter"
                onChange={e => setNameDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); addOne(nameDraft); setNameDraft(''); }
                }}
              />
            </label>
            <button className="btn btn--primary" onClick={() => { addOne(nameDraft); setNameDraft(''); }}>
              Add player
            </button>
          </div>

          <div>
            <button className="btn btn--ghost" aria-expanded={showPaste} onClick={() => setShowPaste(s => !s)}>
              {showPaste ? 'Hide bulk add' : 'Paste a list of names'}
            </button>
            {showPaste && (
              <div className="grid gap-2" style={{ marginTop: 'var(--s-3)' }}>
                <label className="label" htmlFor="paste-names" style={{ margin: 0 }}>One name per line</label>
                <textarea
                  id="paste-names"
                  className="input"
                  style={{ minHeight: 120, padding: 12, resize: 'vertical' }}
                  value={pasteDraft}
                  onChange={e => setPasteDraft(e.target.value)}
                  placeholder={'Théo\nRafa\nJules'}
                />
                <div><button className="btn btn--primary" onClick={addPasted}>Add these players</button></div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button className="btn" onClick={loadSample}>See an example (La Masia)</button>
            {entries.length > 0 && <button className="btn btn--ghost" onClick={clearAll}>Clear all</button>}
            <span className="body-sm subtle mono">{entries.length} player{entries.length === 1 ? '' : 's'}</span>
          </div>
        </section>

        {/* View controls */}
        <section className="flex items-center gap-2 flex-wrap no-print">
          <Toggle label="Birth date column" hint="feeds the relative-age check" on={showBirth} onChange={setShowBirth} />
          <Toggle label="Add psychological & social" hint="two more corners, off by default" on={includeOptional} onChange={setIncludeOptional} />
          <Toggle label="Set skill weights" hint="default is an unweighted mean" on={weighted} onChange={enableWeights} />
        </section>

        {weighted && showWeights && (
          <section className="card card--pad grid gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="title-md" style={{ fontSize: 'var(--text-base)' }}>Skill weights</div>
              <span className={`chip ${Math.round(wSum) === 100 ? 'chip--success' : 'chip--warning'}`}>
                sum {Math.round(wSum * 10) / 10}{Math.round(wSum) === 100 ? '' : ' · should be 100'}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {skills.map(s => (
                <label key={s.id} className="flex items-center justify-between gap-3">
                  <span className="body-sm">{s.label}</span>
                  <input
                    type="number" min={0} step={1}
                    className="input input--mono"
                    style={{ width: 84 }}
                    aria-label={`${s.label} weight`}
                    value={weights[s.id] ?? 0}
                    onChange={e => setWeights(w => ({ ...w, [s.id]: Number(e.target.value) }))}
                  />
                </label>
              ))}
            </div>
            <p className="body-sm subtle" style={{ margin: 0 }}>
              Weights are private to you. The overall is a weight-blended average while this is on; the
              check will flag a sum that isn’t 100.
            </p>
          </section>
        )}

        {/* The grid */}
        <section className="grid gap-4">
          <EvaluateGrid
            entries={entries}
            skills={skills}
            ranked={ranked}
            showBirth={showBirth}
            onScore={score}
            onName={rename}
            onBirth={setBirth}
            onNotes={setNotes}
            onRemove={remove}
          />
          <p className="body-sm subtle" style={{ margin: 0 }}>
            Empty cells stay blank — never defaulted to a midpoint. Use number keys 1–{SCALE_MAX} to score,
            arrow keys to move, Tab to advance. An empty player is unranked, not ranked at zero.
          </p>
        </section>

        {/* Actions */}
        <section className="flex items-center gap-3 flex-wrap">
          <button className="btn btn--primary" disabled={!hasAnyScore} onClick={() => setChecked(true)}>
            Check this evaluation
          </button>
          <button className="btn" disabled={entries.length === 0} onClick={exportXlsx}>Export .xlsx</button>
          <span className="body-sm subtle">Check the evaluation to print or download the report.</span>
        </section>
      </div>
    </div>
  );
}

function Toggle({ label, hint, on, onChange }: {
  label: string; hint: string; on: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={`toggle${on ? ' toggle--on' : ''}`}
      onClick={() => onChange(!on)}
      title={hint}
    >
      <span className="toggle__dot" aria-hidden />
      <span className="toggle__label">{label}</span>
    </button>
  );
}
