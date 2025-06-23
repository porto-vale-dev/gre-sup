
export type TicketStatus = "Novo" | "Em Andamento" | "Atrasado" | "Concluído";

export interface Ticket {
  id: string; 
  name: string;
  phone: string;
  reason: string;
  estimatedResponseTime: string;
  observations?: string | null;
  submissionDate: string; 
  status: TicketStatus;
  responsible?: string | null;
  user_id?: string | null; 
  
  // File properties matching the database schema
  file_path?: string | null;
  file_name?: string | null;
}
