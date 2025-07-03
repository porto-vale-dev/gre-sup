
import { createClient } from '@supabase/supabase-js';

// Esta é a solução definitiva e padrão para lidar com variáveis de ambiente no Next.js
// quando se usa um serviço como o Cloud Run.

// 1. Função para obter a URL do Supabase
const getSupabaseUrl = () => {
  // No servidor (durante o build), se a variável não existir, usa uma URL temporária
  // para permitir que o build seja concluído com sucesso.
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  }
  // No navegador do cliente, a variável REAL do Cloud Run estará disponível.
  // Usamos '!' para garantir que ela será usada, pois é obrigatória para o app funcionar.
  return process.env.NEXT_PUBLIC_SUPABASE_URL!;
};

// 2. Função para obter a Chave Anônima do Supabase
const getSupabaseAnonKey = () => {
  // Mesma lógica para a chave anônima.
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  }
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
};

// 3. Criação do cliente Supabase
// Este cliente agora é inteligente: ele sabe como se comportar durante o build e
// como usar as credenciais corretas quando o aplicativo está no ar.
export const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey());
