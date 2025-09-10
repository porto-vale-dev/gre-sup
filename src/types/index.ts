

export type TicketStatus = "Novo" | "Em Andamento" | "Ativo" | "Atrasado" | "Concluído";
export type CobrancaTicketStatus = "Aberta" | "Em análise" | "Encaminhada" | "Respondida" | "Resolvida" | "Dentro do prazo" | "Fora do prazo" | "Reabertura";
export type RetornoComercialStatus = 'Tirou dúvidas' | 'Tentando contato' | 'Em andamento' | 'Revertido' | 'Não Revertido' | 'Sem retorno';


export interface SolutionFile {
  file_path: string;
  file_name: string;
}

export interface Ticket {
  id: string; 
  protocol: number; 
  name: string;
  phone: string;
  copy_email?: string | null;
  client_name: string;
  cpf: string;
  grupo: string;
  cota: string;
  reason: string;
  estimated_response_time: string;
  observations?: string | null;
  submission_date: string; 
  status: TicketStatus;
  responsible?: string | null;
  user_id?: string | null; 
  
  file_path?: string | null;
  file_name?: string | null;

  solution?: string | null;
  solution_files?: SolutionFile[] | null;
}

// Type for the new "Apoio ao Comercial" tickets
export interface CobrancaTicket {
  id: string;
  protocolo?: number;
  created_at: string; // ISO String from Supabase
  // Identificação
  nome_cliente: string;
  cpf: string;
  cota: string;
  producao: string;
  telefone: string;
  email: string;
  // Responsáveis
  diretor: string;
  gerente: string;
  email_gerente?: string | null;
  email_diretor?: string | null;
  data_atend: string; // ISO String
  // Detalhes
  motivo: string;
  observacoes?: string | null;
  // Retorno
  status_retorno?: RetornoComercialStatus | null;
  obs_retorno?: string | null;
  // Controle
  status: CobrancaTicketStatus;
  user_id?: string | null; // Who created the ticket
}

export type CreateCobrancaTicket = Omit<CobrancaTicket, 'id' | 'data_atend' | 'status' | 'status_retorno' | 'obs_retorno' | 'user_id' | 'email_gerente' | 'email_diretor' | 'protocolo' | 'created_at'> & { user_id: string };


// Represents one row in the reason_assignments table for Suporte GRE
export interface ReasonAssignment {
  reason: string;
  username: string;
}

