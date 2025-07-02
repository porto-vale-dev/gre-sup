import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Provide dummy values if the environment variables are not set during build.
// This allows the build to pass. At runtime, the actual environment variables from
// Cloud Run will be used, and the client will be re-initialized correctly.
const url = supabaseUrl || "http://localhost:54321";
const key = supabaseAnonKey || "dummy-key-for-build-only-this-will-not-be-used-in-production";

export const supabase = createClient(url, key, {
    auth: {
        // This is important to prevent the dummy client from trying to persist sessions
        // during the build process.
        persistSession: !!supabaseUrl,
    },
});

// Also, log a warning if the real variables are missing during build, so it's clear what's happening.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(`
    -------------------------------------------------------------------
    WARNING: Supabase credentials not found. Using dummy values for build.
    This is expected during the build process on services like Cloud Run.
    Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
    are set as runtime environment variables in your service configuration.
    -------------------------------------------------------------------
  `);
}
