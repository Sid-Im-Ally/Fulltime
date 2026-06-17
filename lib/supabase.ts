import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// True only when both env vars are present. The app runs fully without Supabase;
// the waitlist form degrades to a "not connected" message.
export const waitlistEnabled: boolean = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = waitlistEnabled
  ? createClient(url as string, anonKey as string)
  : null;
