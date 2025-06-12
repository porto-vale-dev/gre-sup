import { z } from 'zod';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES, MAX_OBSERVATIONS_LENGTH } from './constants';

export const ticketSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório." }),
  phone: z.string().min(1, { message: "Telefone é obrigatório." }),
  reason: z.string().min(1, { message: "Motivo do ticket é obrigatório." }),
  observations: z.string().max(MAX_OBSERVATIONS_LENGTH, { message: `Observações não podem exceder ${MAX_OBSERVATIONS_LENGTH} caracteres.` }).optional(),
  file: z
    .custom<FileList>()
    .refine((files) => files === undefined || files === null || files.length === 0 || (files?.[0]?.size <= MAX_FILE_SIZE), `Tamanho máximo do arquivo é 5MB.`)
    .refine(
      (files) => files === undefined || files === null || files.length === 0 || ALLOWED_FILE_TYPES.includes(files?.[0]?.type) || ALLOWED_FILE_TYPES.some(ext => files?.[0]?.name.endsWith(ext)),
      "Tipos de arquivo permitidos: PDF, DOC, DOCX, TXT, XLS, XLSX, CSV, JPG, JPEG, PNG, GIF."
    )
    .optional(),
});

export type TicketFormData = z.infer<typeof ticketSchema>;

export const loginSchema = z.object({
  username: z.string().min(1, { message: "Usuário é obrigatório." }),
  password: z.string().min(1, { message: "Senha é obrigatória." }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
