import { createClient } from '@supabase/supabase-js';

// This client is for SERVER-SIDE USE ONLY.
// It uses the service role key and should never be exposed to the client.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Supabase URL is missing for admin client. Check your environment variables for NEXT_PUBLIC_SUPABASE_URL.');
}
if (!serviceRoleKey) {
  throw new Error('Supabase Service Role Key is missing. Check your environment variables for SUPABASE_SERVICE_ROLE_KEY.');
}

// We do not use a singleton here to avoid potential issues with different
// server requests using the same instance. A new client is created per import.
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
