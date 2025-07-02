import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // This warning will appear in the build logs but won't crash the build.
  // The application will only fail at runtime if the variables are not correctly
  // configured in the Cloud Run service's "Variables & Secrets" tab.
  console.warn("Supabase URL or Anon Key is not defined. For Cloud Run deployment, ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in the service's 'Variables & Secrets' tab.");
}

// We use the non-null assertion (!) to tell TypeScript that these values will be available at runtime.
// The createClient function will handle cases where they are not, but this allows the build to pass.
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
