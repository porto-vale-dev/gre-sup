
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// This is the crucial change.
// We now demand that the environment variables are present.
// If they are not, the build process will fail with a clear error message.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'CRITICAL ERROR: Supabase environment variables are missing.\n' +
    'Please ensure that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correctly set in your build environment.\n' +
    'In Cloud Run, these need to be available during the build step, not just at runtime.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
