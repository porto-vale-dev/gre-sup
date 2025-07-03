
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

// The app cannot function without these, so we initialize the client.
// The non-null assertions (!) tell TypeScript that we are sure these values
// will be present at runtime. The script in layout.tsx helps ensure this.
// The Supabase client itself will throw an error if the values are null/undefined.
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
