import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Augment the window type to avoid TypeScript errors
declare global {
  interface Window {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  }
}

// Use a global variable to hold the client instance, ensuring it's only created once.
let supabase: SupabaseClient | undefined = undefined;

const createSupabaseClient = () => {
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
    
    // If the client hasn't been created yet, create it.
    if (!supabase) {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    return supabase;
}

// Export a single instance of the function that returns the client.
export const getSupabaseClient = () => {
    if (supabase) {
        return supabase;
    }
    return createSupabaseClient();
};

// For backward compatibility in case other files are importing 'supabase' directly.
const supabaseClient = getSupabaseClient();
export { supabaseClient as supabase };
