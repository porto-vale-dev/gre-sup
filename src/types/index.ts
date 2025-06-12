
export type TicketStatus = "Novo" | "Em Andamento" | "Atrasado" | "Concluído";

export interface TicketFile {
  name: string;
  type: string;
  size: number;
  path?: string; // Path in Supabase Storage, or public URL
  // content?: string; // No longer storing base64 content directly in ticket data
}

export interface Ticket {
  id: string; // Supabase will generate this
  name: string;
  phone: string;
  reason: string;
  estimatedResponseTime: string;
  observations?: string;
  file?: TicketFile; // Contains file metadata including its path in storage
  submissionDate: string; // Supabase calls this created_at, will be handled
  status: TicketStatus;
  responsible?: string;
  user_id?: string; // Optional: if linking to an auth user
}
