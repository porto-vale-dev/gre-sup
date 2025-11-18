import { z } from 'zod';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES, MAX_OBSERVATIONS_LENGTH, MAX_FILES_COUNT, TICKET_REASONS } from './constants';

const fileSchema = z
  .custom<FileList>()
  .refine((files) => !files || files.length <= MAX_FILES_COUNT, 
    `Você pode anexar no máximo ${MAX_FILES_COUNT} arquivos.`
  )
  .refine((files) => {
    if (!files || files.length === 0) return true;
    return Array.from(files).every(file => file.size <= MAX_FILE_SIZE);
  }, `O tamanho máximo por arquivo é de 50MB.`)
  .refine((files) => {
      if (!files || files.length === 0) return true;
      return Array.from(files).every(file => {
        const isAllowedByName = ALLOWED_FILE_TYPES.some(ext => file.name.toLowerCase().endsWith(ext.toLowerCase()));
        const isAllowedByType = ALLOWED_FILE_TYPES.includes(file.type);
        const isAllowedByRegex = !!file.name.match(/\.(pdf|doc|docx|txt|xls|xlsx|csv|jpg|jpeg|png|gif)$/i);
        return isAllowedByName || isAllowedByType || isAllowedByRegex;
      });
  }, "Um ou mais arquivos são de tipo inválido. Tipos permitidos: PDF, DOC(X), TXT, XLS(X), CSV, Imagens.")
  .optional();

const emailValidation = z.string().superRefine((email, ctx) => {
  if (!email || email.trim() === '') {
    return; // Campo é opcional, então se estiver vazio, está tudo bem.
  }
  
  // Verifica se o e-mail tem um formato válido
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Formato de e-mail inválido.",
    });
    return;
  }
  
  // Verifica se o domínio está correto
  if (!email.toLowerCase().endsWith('@portovaleconsorcios.com.br')) {
      ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "O e-mail deve ser do domínio @portovaleconsorcios.com.br",
      });
  }
});


export const ticketSchema = z.object({
  name: z.string().min(1, { message: "Nome do solicitante é obrigatório." }),
  phone: z.string().min(14, { message: "Telefone inválido. Preencha o DDD e o número." }),
  copy_email: emailValidation.optional().or(z.literal('')),
  client_name: z.string().min(1, { message: "Nome do cliente é obrigatório." }),
  cpf: z.string().min(14, { message: "CPF/CNPJ inválido." }),
  grupo: z.string().min(1, { message: "Grupo é obrigatório." }),
  cota: z.string().min(1, { message: "Cota é obrigatória." }),
  reason: z.enum(TICKET_REASONS.map(r => r.value) as [string, ...string[]], {
    errorMap: () => ({ message: "Por favor, selecione um motivo válido." }),
  }),
  observations: z.string().min(1, { message: "Observações são obrigatórias." }).max(MAX_OBSERVATIONS_LENGTH, { message: `Observações não podem exceder ${MAX_OBSERVATIONS_LENGTH} caracteres.` }),
  file: fileSchema,
}).superRefine((data, ctx) => {
    const requiredForReason = data.reason === "Boleto do mês" || data.reason === "Boleto de quitação";
    if (requiredForReason && (!data.copy_email || data.copy_email.trim() === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['copy_email'],
            message: 'O e-mail para cópia é obrigatório para este motivo.',
        });
    }
});

export type TicketFormData = z.infer<typeof ticketSchema>;

export const loginSchema = z.object({
  username: z.string().min(1, { message: "Usuário é obrigatório." }),
  password: z.string().min(1, { message: "Senha é obrigatória." }),
});

export type LoginFormData = z.infer<typeof loginSchema>;


export const createUserSchema = z.object({
  email_prefix: z.string().min(1, { message: "O início do e-mail é obrigatório." }).regex(/^[a-zA-Z0-9._-]+$/, "Use apenas letras, números, pontos, hífens ou underscores."),
  password: z.string().min(8, { message: "A senha deve ter no mínimo 8 caracteres." }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não correspondem.",
  path: ["confirmPassword"], // path of error
});


export type CreateUserFormData = z.infer<typeof createUserSchema>;