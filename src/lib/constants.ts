
import type { TicketStatus } from '@/types';

export const TICKET_REASONS = [
  { value: "Boleto de lance", label: "Boleto de lance", responseTime: "1 dia útil" },
  { value: "Boleto do mês", label: "Boleto do mês", responseTime: "até 1 dia útil antes do vencimento" },
  { value: "Bloqueio temporário COL (erro de acesso)", label: "Bloqueio temporário COL (erro de acesso)", responseTime: "1 dia útil" },
  { value: "Cadastro COL", label: "Cadastro COL", responseTime: "1 dia útil" },
  { value: "Código de cliente", label: "Código de cliente", responseTime: "1 dia útil" },
  { value: "Contrato 2° via simples", label: "Contrato 2° via simples", responseTime: "1 dia útil" },
  { value: "Contrato assinado pela Porto", label: "Contrato assinado pela Porto", responseTime: "7 dias úteis" },
  { value: "Correção de cadastro - nome e estado civil", label: "Correção de cadastro - nome e estado civil", responseTime: "3 dias úteis" },
  { value: "Devolução de valores", label: "Devolução de valores", responseTime: "10 a 15 dias úteis" },
  { value: "Extrato financeiro", label: "Extrato financeiro", responseTime: "1 dia útil" },
  { value: "Gestão de pendências Porto", label: "Gestão de pendências Porto", responseTime: "1 dia útil" },
  { value: "Inscrições ABAC", label: "Inscrições ABAC", responseTime: "1 dia útil" },
  { value: "Link de cartão", label: "Link de cartão", responseTime: "1 dia útil" },
  { value: "Parcela divergente", label: "Parcela divergente", responseTime: "prazo variável" },
  { value: "Processo de transferencia", label: "Processo de transferencia", responseTime: "7 a 10 dias úteis" },
  { value: "Simulação de aumento de crédito", label: "Simulação de aumento de crédito", responseTime: "1 dia útil" },
  { value: "Tratativas de duplicidade de pagamento", label: "Tratativas de duplicidade de pagamento", responseTime: "10 a 15 dias úteis" },
];

export const TICKET_STATUSES: TicketStatus[] = ["Novo", "Em Andamento", "Atrasado", "Concluído"];

export const ALLOWED_FILE_TYPES = [
  ".pdf",
  ".doc",
  ".docx",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt",
  "text/plain",
  ".xls",
  ".xlsx",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv",
  "text/csv",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  "image/jpeg",
  "image/png",
  "image/gif",
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_FILES_COUNT = 10;
export const MAX_SOLUTION_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_OBSERVATIONS_LENGTH = 10000;
