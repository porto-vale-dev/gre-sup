export type TicketStatus = "Novo" | "Em Andamento" | "Atrasado" | "Concluído";

export interface TicketFile {
  name: string;
  type: string;
  size: number;
  // Base64 content or URL could be added here if needed for previews
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
