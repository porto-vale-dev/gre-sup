
import { z } from 'zod';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES, MAX_OBSERVATIONS_LENGTH, MAX_FILES_COUNT } from './constants';

export const ticketSchema = z.object({
  name: z.string().min(1, { message: "Nome do solicitante é obrigatório." }),
  phone: z.string().min(14, { message: "Telefone inválido. Preencha o DDD e o número." }),
  copy_email_prefix: z.string().optional(),
  client_name: z.string().min(1, { message: "Nome do cliente é obrigatório." }),
  cpf: z.string().min(1, { message: "CPF ou CNPJ do cliente é obrigatório." }),
  grupo: z.string().min(1, { message: "Grupo é obrigatório." }),
  cota: z.string().min(1, { message: "Cota é obrigatória." }),
  reason: z.string().min(1, { message: "Motivo do ticket é obrigatório." }),
  observations: z.string().min(1, { message: "Observações são obrigatórias." }).max(MAX_OBSERVATIONS_LENGTH, { message: `Observações não podem exceder ${MAX_OBSERVATIONS_LENGTH} caracteres.` }),
  file: z
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
    .optional(),
});

export type TicketFormData = z.infer<typeof ticketSchema>;

export const loginSchema = z.object({
  username: z.string().min(1, { message: "Usuário é obrigatório." }),
  password: z.string().min(1, { message: "Senha é obrigatória." }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
