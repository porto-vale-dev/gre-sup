
export type TicketStatus = "Novo" | "Em Andamento" | "Atrasado" | "Concluído";

export interface TicketFile {
  name: string;
  type: string;
  size: number;
  content?: string; // To store file content as base64 data URI
}

export interface Ticket {
  id: string;
  name: string;
  phone: string;
  reason: string;
  estimatedResponseTime: string;
  observations?: string;
  file?: TicketFile;
  submissionDate: string; // Store as ISO string
  status: TicketStatus;
  responsible?: string;
}
