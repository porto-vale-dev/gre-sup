
export type TicketStatus = "Novo" | "Em Andamento" | "Atrasado" | "Concluído";

export interface TicketFile {
  name: string;
  type: string;
  size: number;
  content: string; // Base64 data URL content
  path?: string; // Kept for potential future use, but not for local storage
}

export interface Ticket {
  id: string; 
  name: string;
  phone: string;
  reason: string;
  estimatedResponseTime: string;
  observations?: string;
  file?: TicketFile; 
  submissionDate: string; 
  status: TicketStatus;
  responsible?: string;
  user_id?: string; // Stores the username of the logged-in user
}
