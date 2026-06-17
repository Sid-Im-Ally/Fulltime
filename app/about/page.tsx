import { WaitlistForm } from '@/components/WaitlistForm';
import { PRODUCT_NAME, PARENT_BRAND } from '@/lib/brand';

export const metadata = {
  title: `About — ${PRODUCT_NAME} by ${PARENT_BRAND}`,
};

const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: '01',
    title: 'Opens your file privately',
    body: 'Your spreadsheet opens right here in your web browser, on your own computer. It’s never sent anywhere and nothing is saved.',
  },
  {
    n: '02',
    title: 'Checks the maths adds up',
    body: 'Makes sure the scoring holds together — that any weightings total what they should, each overall score matches the marks it’s built from, and no score is left blank or sits outside the rating scale.',
  },
  {
    n: '03',
    title: 'Looks for tell-tale scoring habits',
    body: 'Points out patterns that can quietly tilt a ranking — like marking everyone around the middle, scoring high or low across the board, giving a player nearly the same mark on everything, or favouring children born earlier in the year. Things to double-check, not proof anything is wrong.',
  },
  {
    n: '04',
    title: 'Shows what was and wasn’t looked at',
    body: 'Lays out which sides of a player’s game the scoring actually covered, and which were never rated — so it’s clear what the ranking is, and isn’t, based on.',
  },
  {
    n: '05',
    title: 'Shows how every score was reached',
    body: 'For each player, breaks down exactly how their overall number was put together from the individual marks. It makes the number easy to follow — it doesn’t claim the number is right.',
  },
];

export default function AboutPage() {
  return (
    <div className="container container--narrow" style={{ padding: 'var(--s-10) var(--s-5) var(--s-20)' }}>
      <div className="grid gap-8">
        {/* The process Full-Time follows */}
        <section className="grid gap-3">
          <div className="eyebrow">About</div>
          <h1 className="title-xl">How {PRODUCT_NAME} checks an evaluation</h1>
          <p className="body-base muted">
            Evaluators know the players — the eye for talent, the context, the judgment calls are
            theirs, and {PRODUCT_NAME} never second-guesses them. All it does is run our algorithm
            across the finished spreadsheet to check that the rubric holds together — the weights are
            sound, the formulas compute what they claim to, every score is complete and in range, and
            the ranking is free of the patterns that quietly skew it. You make the call; we just check
            the work behind it. The check runs in five passes:
          </p>
        </section>

        <ol className="grid gap-3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {STEPS.map(s => (
            <li key={s.n} className="card card--pad">
              <div className="flex items-start gap-4">
                <span className="mono" style={{ fontSize: 'var(--text-lg)', color: 'var(--primary)' }}>{s.n}</span>
                <div>
                  <div className="title-md" style={{ fontSize: 'var(--text-base)' }}>{s.title}</div>
                  <p className="body-sm muted" style={{ marginTop: 6 }}>{s.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {/* Where this fits: Off-Hours */}
        <section className="grid gap-4" style={{ borderTop: '1px solid var(--border-faint)', paddingTop: 'var(--s-8)' }}>
          <div>
            <div className="eyebrow">The bigger picture</div>
            <h2 className="title-lg" style={{ marginTop: 8 }}>Where this fits: {PARENT_BRAND}</h2>
          </div>
          <p className="body-base muted">
            {PARENT_BRAND} is a training companion for youth athletes during the unstructured time
            between team practices — daily, narrative-wrapped missions that turn the off-hours into
            deliberate reps, with dashboards for coaches and a weekly digest for parents.
          </p>
          <p className="body-base muted">
            {PRODUCT_NAME}{' '}is the evaluator and coach-side companion to it. End-of-season scoring is
            where a lot of a club&rsquo;s trust is won or lost, and it usually happens in a private
            spreadsheet. This tool turns that spreadsheet into something everyone can see.
          </p>
          <p className="body-base muted">
            Today, {PRODUCT_NAME}{' '}reads the evaluation file you already produce and makes it legible.
            Where we&rsquo;d like to take it: evaluators and coaches recording their assessments —
            notes, rubric and scores — directly in {PRODUCT_NAME}{' '}across the season, so the
            end-of-season picture could be built from months of observation rather than a single
            session. That&rsquo;s a direction, not something the tool does yet. If it&rsquo;s one your
            club would want, the waitlist below is where to tell us.
          </p>
        </section>

        {/* Waitlist */}
        <div className="card card--pad grid gap-4">
          <div>
            <div className="eyebrow">Waitlist</div>
            <h2 className="title-md" style={{ marginTop: 8 }}>Stay in the loop</h2>
            <p className="body-sm muted" style={{ marginTop: 6 }}>
              Leave an email and we&rsquo;ll let you know as this grows beyond a proof of concept.
            </p>
          </div>
          <WaitlistForm />
        </div>

        <p className="privacy-line">
          The only thing that ever leaves your device is the email you choose to give us here. No
          roster, no scores, no report.
        </p>
      </div>
    </div>
  );
}
