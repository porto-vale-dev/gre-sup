comentario
/*import { createClient } from '@supabase/supabase-js';

// This client is for SERVER-SIDE USE ONLY.
// It uses the service role key and should never be exposed to the client.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// =================================================================================
//  AVISO DE SEGURANÇA: Colar a chave aqui é inseguro para produção.
//  Use variáveis de ambiente (.env.local) sempre que possível.
//  Substitua "COLE_SUA_CHAVE_AQUI" pela sua service_role_key do Supabase.
// =================================================================================
const serviceRoleKey = "chave"; // process.env.SUPABASE_SERVICE_ROLE_KEY;


if (!supabaseUrl) {
  throw new Error('Supabase URL is missing for admin client. Check your environment variables for NEXT_PUBLIC_SUPABASE_URL.');
}
if (!serviceRoleKey) {
  throw new Error('A chave de serviço (Supabase Service Role Key) não foi definida. Cole a chave no arquivo src/lib/supabaseAdminClient.ts ou configure a variável de ambiente SUPABASE_SERVICE_ROLE_KEY.');
}

// We do not use a singleton here to avoid potential issues with different
// server requests using the same instance. A new client is created per import.
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
*/