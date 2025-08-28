
'use server';

import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { headers } from 'next/headers';

interface ActionResult {
    success: boolean;
    message: string;
}

// Ação para solicitar o e-mail de recuperação
export async function requestPasswordResetAction(
  formData: FormData
): Promise<ActionResult> {
  const emailPrefixSchema = z.string().min(1, { message: "O prefixo do e-mail é obrigatório."});
  const validatedFields = emailPrefixSchema.safeParse(formData.get('email_prefix'));

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Formato de e-mail inválido. Por favor, verifique e tente novamente.',
    };
  }

  const origin = headers().get('origin');
  const email = `${validatedFields.data}@portovaleconsorcios.com.br`;
  // URL de redirecionamento agora é dinâmica, baseada na origem da requisição
  const redirectUrl = `${origin}/atualizar-senha`;
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  if (error) {
    // Para segurança, não revelamos se o e-mail existe ou não.
    console.error('Password Reset Error:', error.message);
    return { 
        success: true, 
        message: 'Se um usuário com este e-mail existir, um link de recuperação será enviado. Verifique sua caixa de entrada e spam.' 
    };
  }

  return { 
    success: true, 
    message: 'Se um usuário com este e-mail existir, um link de recuperação será enviado. Verifique sua caixa de entrada e spam.' 
  };
}

// Ação para atualizar a senha foi removida, pois a lógica foi movida para o lado do cliente
// para garantir o uso correto da sessão temporária do Supabase.
