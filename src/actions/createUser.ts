'use server';

import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient'; 
import { createUserSchema } from '@/lib/schemas';

// Define the shape of the return value
interface CreateUserResult {
    success: boolean;
    message: string;
}

export async function createUserAction(
  formData: FormData
): Promise<CreateUserResult> {
  // 1. Validate form data
  const validatedFields = createUserSchema.safeParse(
    Object.fromEntries(formData.entries())
  );
  
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    const message = Object.values(errorMessages).flat().join(' ') || "Dados inválidos.";
    return {
      success: false,
      message: message,
    };
  }
  
  const { email_prefix, password } = validatedFields.data;
  const email = `${email_prefix}@portovaleconsorcios.com.br`;
  const username = email_prefix;

  // 2. Create the user using the standard signUp method.
  // This is secure and automatically handles sending the confirmation email.
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        username: username,
        cargo: 'colaborador' // Set user metadata here
      }
    }
  });

  if (signUpError) {
    console.error('Error creating user:', signUpError.message);
    if (signUpError.message.includes('User already registered')) {
        return { success: false, message: 'Este usuário já existe.' };
    }
    return { success: false, message: 'Não foi possível criar o usuário. Tente novamente.' };
  }
  
  if (signUpData.user && !signUpData.user.identities?.length) {
    return {
      success: false,
      message: 'Este usuário já existe, mas está inativo. Contate o suporte.',
    };
  }

  // 3. Return success message
  return { 
    success: true, 
    message: `Conta criada para ${email}. Um e-mail de confirmação foi enviado para que o usuário possa ativar a conta.` 
  };
}
