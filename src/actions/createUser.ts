
'use server';

import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { createUserSchema } from '@/lib/schemas';

// Define the shape of the return value
interface CreateUserResult {
    success: boolean;
    message: string;
}

export async function createUserAction(
  prevState: CreateUserResult,
  formData: FormData
): Promise<CreateUserResult> {
  // 1. Validate form data
  const validatedFields = createUserSchema.safeParse(
    Object.fromEntries(formData.entries())
  );
  
  if (!validatedFields.success) {
    return {
      success: false,
      message: "Dados inválidos: " + validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { email_prefix, password } = validatedFields.data;
  const email = `${email_prefix}@portovaleconsorcios.com.br`;
  const username = email_prefix;

  // 2. Invite the user by email, which sends a confirmation link
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    { 
      password: password,
      data: {
        username: username,
        cargo: 'colaborador' // Always set cargo to 'colaborador'
      }
    }
  );

  if (error) {
    console.error('Error inviting user:', error.message);
    // Provide a more user-friendly error message
    if (error.message.includes('unique constraint') || error.message.includes('User already registered')) {
        return { success: false, message: 'Este usuário já existe.' };
    }
    return { success: false, message: 'Não foi possível criar o convite. Tente novamente.' };
  }

  // 3. Return success message
  return { success: true, message: `Convite enviado para ${email}. O usuário precisará confirmar o e-mail para ativar a conta.` };
}
