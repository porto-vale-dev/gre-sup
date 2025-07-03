
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

// Throw a clear error if the variables are not available at runtime.
// The app cannot function without them.
if (!supabaseUrl) {
  throw new Error('Supabase URL is missing. Check your .env.local file or server environment variables for NEXT_PUBLIC_SUPABASE_URL.');
}
if (!supabaseAnonKey) {
  throw new Error('Supabase Anon Key is missing. Check your .env.local file or server environment variables for NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
