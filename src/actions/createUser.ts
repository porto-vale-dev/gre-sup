
'use server';

import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { supabase } from '@/lib/supabaseClient'; // Import the client-side instance for resend
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

  // 2. Create the user with the admin client, but do not confirm the email.
  const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    user_metadata: {
      username: username,
      cargo: 'colaborador' // Always set cargo to 'colaborador'
    }
  });

  if (createError) {
    console.error('Error creating user:', createError.message);
    if (createError.message.includes('unique constraint') || createError.message.includes('User already registered')) {
        return { success: false, message: 'Este usuário já existe.' };
    }
    return { success: false, message: 'Não foi possível criar o usuário. Tente novamente.' };
  }

  // 3. Explicitly send the confirmation email using the public client's `resend` method.
  const { error: resendError } = await supabase.auth.resend({
    type: 'signup',
    email: email,
  });

  if (resendError) {
      console.error('Error sending confirmation email:', resendError.message);
      // Even if the email fails, the user was created. This is a partial success.
      // We inform the admin that the user exists but the email might not have been sent.
      return { 
          success: true, 
          message: `Conta criada para ${email}, mas falha ao enviar o e-mail de confirmação. Verifique as configurações de SMTP no Supabase. O usuário pode solicitar um novo e-mail na tela de login.` 
      };
  }

  // 4. Return full success message
  return { 
    success: true, 
    message: `Conta criada para ${email}. Um e-mail de confirmação foi enviado para que o usuário possa ativar a conta.` 
  };
}
