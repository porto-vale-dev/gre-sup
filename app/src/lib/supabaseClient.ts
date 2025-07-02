
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // This warning is expected during the build process on services like Cloud Run
  // where environment variables are injected at runtime, not build time.
  console.warn(
    '-------------------------------------------------------------------\n' +
    'WARNING: Supabase credentials not found. Using dummy values for build.\n' +
    'This is expected during the build process on services like Cloud Run.\n' +
    'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
    'are set as runtime environment variables in your service configuration.\n' +
    '-------------------------------------------------------------------'
  );
}

// Provide dummy values if the real ones aren't available during the build.
// The real values from the Cloud Run environment will be available at runtime for server-side operations.
// The client-side will have an issue we will fix in the next step.
export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);
