import { createClient } from '@supabase/supabase-js';

// This client is for SERVER-SIDE USE ONLY.
// It uses the service role key and should never be exposed to the client.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// =================================================================================
//  AVISO DE SEGURANÇA: Colar a chave aqui é inseguro para produção.
//  Use variáveis de ambiente (.env.local) sempre que possível.
//  Substitua "COLE_SUA_CHAVE_AQUI" pela sua service_role_key do Supabase.
// =================================================================================
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6YnNxbHV0ZGp3YWJnanVoc2luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTc2MTUzMiwiZXhwIjoyMDY1MzM3NTMyfQ.9bFsJAukdBb4LBu-1EwqMGZfDOfPc1svjANVT5Tbmhs"; // process.env.SUPABASE_SERVICE_ROLE_KEY;


if (!supabaseUrl) {
  throw new Error('Supabase URL is missing for admin client. Check your environment variables for NEXT_PUBLIC_SUPABASE_URL.');
}
if (!serviceRoleKey || serviceRoleKey.startsWith("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")) { // Basic check for a placeholder JWT
  // This check is a placeholder. In a real scenario, you might have a different placeholder.
  // The goal is to ensure a real key is present.
  const placeholderKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6YnNxbHV0ZGp3YWJnanVoc2luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTc2MTUzMiwiZXhwIjoyMDY1MzM3NTMyfQ.9bFsJAukdBb4LBu-1EwqMGZfDOfPc1svjANVT5Tbmhs";
  if(serviceRoleKey === placeholderKey){
     throw new Error('A chave de serviço (Supabase Service Role Key) não foi definida. Cole a chave no arquivo src/lib/supabaseAdminClient.ts ou configure a variável de ambiente SUPABASE_SERVICE_ROLE_KEY.');
  }
}

// We do not use a singleton here to avoid potential issues with different
// server requests using the same instance. A new client is created per import.
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
