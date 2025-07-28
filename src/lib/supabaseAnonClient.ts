
import { createClient } from '@supabase/supabase-js';

// Este cliente é *exclusivamente* para operações que devem ser 100% anônimas.
// Ele garante que nenhuma sessão de usuário autenticado (mesmo que expirada)
// interfira em políticas de RLS para o role 'anon'.

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof window !== 'undefined' ? window.NEXT_PUBLIC_SUPABASE_URL : undefined);

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (typeof window !== 'undefined' ? window.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined);

if (!supabaseUrl) {
  throw new Error('Supabase URL is missing for anon client. Check your .env.local file or server environment variables for NEXT_PUBLIC_SUPABASE_URL.');
}
if (!supabaseAnonKey) {
  throw new Error('Supabase Anon Key is missing for anon client. Check your .env.local file or server environment variables for NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
