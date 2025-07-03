
import { createClient } from '@supabase/supabase-js';

// Augment the window type to avoid TypeScript errors
declare global {
  interface Window {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  }
}

// In a standard Next.js setup (like local dev), `process.env` is populated on the client.
// We prioritize that. For special deployment environments (like Cloud Run),
// `process.env` might be empty on the client, so we fall back to the `window`
// variables injected by the root layout.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof window !== 'undefined' ? window.NEXT_PUBLIC_SUPABASE_URL : undefined);

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (typeof window !== 'undefined' ? window.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined);

// Throw a clear error if the variables are not available at runtime from either source.
// The app cannot function without them.
if (!supabaseUrl) {
  throw new Error('Supabase URL is missing. Check your .env.local file or server environment variables for NEXT_PUBLIC_SUPABASE_URL.');
}
if (!supabaseAnonKey) {
  throw new Error('Supabase Anon Key is missing. Check your .env.local file or server environment variables for NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
