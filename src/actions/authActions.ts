'use server';

import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';

interface ActionResult {
    success: boolean;
    message: string;
}

// Ação para solicitar o e-mail de recuperação
export async function requestPasswordResetAction(
  prevState: ActionResult,
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

  const email = `${validatedFields.data}@portovaleconsorcios.com.br`;
  const redirectUrl = new URL('/atualizar-senha', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002').toString();
  
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

// Ação para atualizar a senha
const updatePasswordSchema = z.object({
  password: z.string().min(8, { message: "A nova senha deve ter no mínimo 8 caracteres." }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não correspondem.",
  path: ["confirmPassword"],
});

export async function updatePasswordAction(
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const validatedFields = updatePasswordSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Dados inválidos: " + JSON.stringify(validatedFields.error.flatten().fieldErrors),
    };
  }

  const { password } = validatedFields.data;

  // updateUser requer que o usuário esteja logado (o que acontece automaticamente
  // ao clicar no link de recuperação de senha).
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
     console.error('Password Update Error:', error.message);
    return { success: false, message: 'Não foi possível atualizar a senha. O link pode ter expirado. Tente novamente.' };
  }

  return { success: true, message: 'Senha atualizada com sucesso! Você já pode fazer login com sua nova senha.' };
}
