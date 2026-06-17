'use client';

import { useState } from 'react';
import { supabase, waitlistEnabled } from '@/lib/supabase';

type State = { kind: 'idle' | 'sending' | 'done' | 'error' | 'disabled'; message?: string };

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    if (!waitlistEnabled || !supabase) {
      setState({ kind: 'disabled', message: "Waitlist isn't connected in this build yet." });
      return;
    }

    setState({ kind: 'sending' });
    const { error } = await supabase
      .from('waitlist')
      .insert({ email: email.trim(), note: note.trim() || null });

    if (error) {
      setState({ kind: 'error', message: 'Something went wrong — please try again.' });
    } else {
      setState({ kind: 'done' });
      setEmail('');
      setNote('');
    }
  }

  if (state.kind === 'done') {
    return (
      <div className="note note--success">
        <span className="dot dot--success" style={{ marginTop: 5 }} />
        <span>Thanks — you&rsquo;re on the list. We&rsquo;ll be in touch.</span>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <div>
        <label className="label" htmlFor="wl-email">Email</label>
        <input
          id="wl-email"
          className="input"
          type="email"
          required
          placeholder="you@club.org"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="wl-note">A line about your club <span className="subtle">(optional)</span></label>
        <input
          id="wl-note"
          className="input"
          type="text"
          placeholder="U-12s at a grassroots club in Leeds…"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button className="btn btn--primary" type="submit" disabled={state.kind === 'sending'}>
          {state.kind === 'sending' ? 'Sending…' : 'Join the waitlist'}
        </button>
        {(state.kind === 'disabled' || state.kind === 'error') && (
          <span className="body-sm subtle">{state.message}</span>
        )}
      </div>
    </form>
  );
}
