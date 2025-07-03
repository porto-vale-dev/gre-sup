
import { createClient } from '@supabase/supabase-js';

// This setup ensures the Supabase client is initialized with the correct
// runtime environment variables, both on the server (for SSR) and on the client.

// Augment the window type to avoid TypeScript errors
declare global {
  interface Window {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  }
}

// On the client, we expect the variables to be injected into the `window` object
// by the root layout. On the server, we read directly from `process.env`.
const supabaseUrl =
  typeof window !== 'undefined'
    ? window.NEXT_PUBLIC_SUPABASE_URL
    : process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  typeof window !== 'undefined'
    ? window.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Throw a more helpful error if the variables are missing.
// This helps distinguish between a server-side environment issue and a client-side injection issue.
if (!supabaseUrl) {
  throw new Error('Supabase URL is missing. Ensure NEXT_PUBLIC_SUPABASE_URL is set in your environment.');
}
if (!supabaseAnonKey) {
  throw new Error('Supabase Anon Key is missing. Ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is set in your environment.');
}

// The app cannot function without these, so we initialize the client.
// The checks above replace the need for non-null assertions (!).
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
