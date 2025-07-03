
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

// The non-null assertions (!) are used here to ensure that the app will fail fast
// if the environment variables are not available at runtime, which is the correct
// behavior as the app cannot function without them.
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
