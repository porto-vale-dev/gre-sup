import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // This error is thrown when the Supabase environment variables are not set.
  // - For local development, ensure you have a .env.local file in the root with the variables.
  // - For production (like Cloud Run), these variables must be configured directly in the
  //   service's environment variables settings, as .env.local is not used.
  throw new Error("Supabase URL ou Chave Anônima não estão definidos. Para deploy no Cloud Run, configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY na aba 'Variáveis e Segredos' do seu serviço.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
