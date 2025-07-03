
import { createClient } from '@supabase/supabase-js';

// These functions ensure the correct variables are used based on the environment.
const getSupabaseUrl = () => {
  // If the code is running on the server (e.g., during build) and the URL is missing,
  // we provide a dummy URL to allow the build process to complete successfully.
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  }
  // If the code is running in the browser, the environment variable MUST be available.
  // We use it directly, ensuring we never try to connect to localhost from the client.
  return process.env.NEXT_PUBLIC_SUPABASE_URL!;
};

const getSupabaseAnonKey = () => {
  // Same logic as above for the anonymous key.
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  }
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
};


// The Supabase client is now created using the environment-aware functions.
// This is the definitive solution to the build-time vs. runtime environment variable problem.
export const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey());
