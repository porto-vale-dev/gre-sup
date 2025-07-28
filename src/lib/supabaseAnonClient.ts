
import { createClient } from '@supabase/supabase-js';

// This client is *exclusively* for operations that must be 100% anonymous.
// It ensures that no authenticated user session (even an expired one)
// interferes with RLS policies for the 'anon' role.
// It uses its own isolated storage, preventing it from reading the session
// token from the default client's storage.

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof window !== 'undefined' ? window.NEXT_PUBLIC_SUPABASE_URL : undefined);

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (typeof window !== 'undefined' ? window.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined);

if (!supabaseUrl) {
  throw new Error('Supabase URL is missing for anon client. Check your .env.local file or server environment variables for NEXT_PUBLIC_SUPABASE_URL.');
}
if (!supabaseAnonKey) {
  throw new Error('Supabase Anon Key is missing for anon client. Check your .env.local file or server environment variables for NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // This is the key change: it prevents this client from looking at the
    // default localStorage key and finding an expired session token.
    storageKey: 'supabase-anon-session',
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  }
});
