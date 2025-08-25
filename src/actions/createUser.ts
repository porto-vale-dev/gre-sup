
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

  // 2. Create the user using the admin client, sending a confirmation email
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false, // Set to false to send a confirmation link
    user_metadata: {
        username: username,
        cargo: 'colaborador' // Always set cargo to 'colaborador'
    }
  });

  if (error) {
    console.error('Error creating user:', error.message);
    // Provide a more user-friendly error message
    if (error.message.includes('unique constraint')) {
        return { success: false, message: 'Este usuário já existe.' };
    }
    return { success: false, message: 'Não foi possível criar o usuário. Tente novamente.' };
  }

  // 3. Return success message
  return { success: true, message: `Usuário ${username} criado. Um e-mail de confirmação foi enviado para ${email}.` };
}
