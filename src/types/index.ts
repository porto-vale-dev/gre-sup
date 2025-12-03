




export type TicketStatus = "Novo" | "Em Andamento" | "Ativo" | "Atrasado" | "Concluído" | "Porto Resolve";
export type CobrancaTicketStatus = "Aberta" | "Em análise" | "Encaminhada" | "Respondida" | "Resolvida" | "Dentro do prazo" | "Fora do prazo" | "Reabertura";
export type RetornoComercialStatus = 'Tirou dúvidas' | 'Tentando contato' | 'Em andamento' | 'Revertido' | 'Não Revertido' | 'Sem retorno';
export type PosContemplacaoTicketStatus = "Aberto" | "Em Análise" | "Concluído";
export type ComprasTicketStatus = "Pendente" | "Aprovado" | "Reprovado";


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
  comentarios?: string | null;
}

export interface RetornoComercialComment {
  text: string;
  author: string;
  timestamp: string; // ISO string
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
  obs_retorno?: RetornoComercialComment[] | string | null;
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


// Type for the new "Pós Contemplação" tickets
export interface PosContemplacaoTicket {
  id: string;
  created_at: string;
  protocolo?: number;
  nome_cliente: string;
  cpf: string;
  telefone: string;
  email: string;
  cota: string;
  grupo: string;
  relator: string; // Should store the email of the creator
  responsavel: string; // Should store the email of the responsible person
  motivo: string;
  status: PosContemplacaoTicketStatus;
  observacoes?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  data_limite?: string | null;
}

export type CreatePosContemplacaoTicket = Omit<PosContemplacaoTicket, 'id' | 'created_at' | 'protocolo' | 'status'> & { files?: FileList };

// Type for "Compras" (purchases from Lead Bank)
export interface ComprasTicket {
  id: number;
  created_at: string;
  produto: string;
  quantidade: number;
  total: string;
  tamanho?: string | null;
  retirada: string;
  folha: boolean;
  user_id: string;
  email: string;
  telefone?: string | null;
  aprovado?: boolean | null;
  usuario_compras?: string | null;
  entrega?: boolean | null;
  entregador?: string | null;
}
