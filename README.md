# Full-Time by Off-Hours

A desktop-first, fully mobile-responsive web app for youth-soccer clubs. An evaluator or Director
of Coaching uploads the spreadsheet they use to score and rank players at the end of a season. The
app reads it **entirely in the browser**, runs a set of consistency / integrity / coverage checks,
and renders a transparency report — including a per-family view of one child's result.

It does **not** judge whether a subjective score is "correct." It surfaces what _can_ be checked and
shows the work.

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Drop in an `.xlsx`, `.xls`, or `.csv`, or load one of the two seeded
sample datasets to see a full report without a file.

```bash
npm run build   # production build — must pass with no errors
npm start       # serve the production build
```

---

## How the privacy model works

The uploaded file is parsed in the browser with [SheetJS](https://sheetjs.com/) (`xlsx`). It is
**never sent to any server**. No roster data, no scores, and no report is persisted anywhere. The
only thing that ever touches a backend is the optional waitlist email on the About page.

The app runs fully without any backend configured.

---

## Waitlist (Supabase) — optional

The waitlist is the _only_ networked feature. Without configuration, the form still renders and
simply reports that the waitlist isn't connected.

To enable it:

1. Create `.env.local` in the project root:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

2. Run this SQL in the Supabase SQL editor:

   ```sql
   create table public.waitlist (
     id uuid primary key default gen_random_uuid(),
     email text not null,
     note text,
     created_at timestamptz not null default now()
   );
   alter table public.waitlist enable row level security;
   create policy "anon insert" on public.waitlist for insert to anon with check (true);
   -- intentionally NO select policy: the anon key can write but never read the list.
   ```

3. Restart `npm run dev`. The form will now insert rows into `public.waitlist`.

---

## What the report contains

- **Structural integrity** — weight-sum, composite-vs-inputs drift, blank scores, out-of-range
  values. Objective defects in how the spreadsheet is built.
- **Scoring hygiene** — central tendency, leniency/strictness, halo effect, low discrimination,
  relative age effect. These are _signals_, not proof of error — questions to raise with the
  evaluator.
- **Coverage** — which of the FA four-corner dimensions (here split into five) the rubric measured,
  and which it never scored.
- **Roster** — the ranking, plus a per-player drilldown showing exactly how each composite was
  built (the family view). Responsive: a real table on desktop, stacked cards on narrow screens.
- **Print/PDF** — "Download / print report" uses the browser's print dialog with a dedicated print
  stylesheet (white background, expanded drilldowns, no interactive chrome).

---

## Mapping your columns

After upload, each detected column is mapped to a role (Player name, the five dimensions, Birth
date, Stored composite, or Ignore). Roles are auto-guessed from headers and can be corrected.

- **Weights are off by default** — composites are a simple average. Toggle "I want to enter weights"
  only if your rubric weights the dimensions; the weight-sum-to-100 check runs only then. This
  honors evaluators who keep their weighting private.
- **Birth date** is bucketed into quarters by calendar month (Jan–Mar = Q1 … Oct–Dec = Q4). The
  selection-year cutoff is assumed Jan 1 and is adjustable later. No birth column → the relative-age
  check is skipped.
- **No stored-composite column** → the formula-drift check is skipped.

---

## A note on thresholds

The hygiene and integrity thresholds in `lib/analysis.ts` are **range-relative defaults** (scaled to
the rubric's own min–max), chosen to be reasonable out of the box. They are meant to be calibrated
against a real evaluator file later — the goal of this proof of concept is to make an evaluation
_legible_, not to assert that any particular cutoff is the right one.

---

## Tech

- Next.js (App Router) + TypeScript
- `xlsx` (SheetJS) — client-side parsing
- `@supabase/supabase-js` — waitlist only
- Design tokens in `tokens.css` are the single source of truth for color/type/radius/shadow. The app
  is locked to the light, professional **coach** skin. Tailwind is used only for layout/spacing/
  responsive utilities; all themed styling pulls from the CSS variables (see `app/components.css`).
