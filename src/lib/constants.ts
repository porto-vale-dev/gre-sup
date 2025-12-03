
import type { TicketStatus } from '@/types';

export const TICKET_REASONS = [
  { value: "Baixa de pagamento", label: "Baixa de pagamento", responseTime: "1 dia útil", is_active: true },
  { value: "Boleto do mês", label: "Boleto do mês", responseTime: "1 dia útil", is_active: true },
  { value: "Boleto de quitação", label: "Boleto de quitação", responseTime: "até 1 dia útil antes do vencimento", is_active: true },
  { value: "Boleto em atraso", label: "Boleto em atraso", responseTime: "1 dia útil", is_active: true },
  { value: "BLOQUEIO CORRETOR ONLINE (COL de vendedores)", label: "BLOQUEIO CORRETOR ONLINE (COL de vendedores)", responseTime: "1 dia útil", is_active: true },
  { value: "Cancelamento", label: "Cancelamento", responseTime: "1 dia útil", is_active: true },
  { value: "Cadastro COL", label: "Cadastro COL", responseTime: "1 dia útil", is_active: true },
  { value: "Código de cliente", label: "Código de cliente", responseTime: "1 dia útil", is_active: true },
  { value: "Contrato 2° via simples", label: "Contrato 2° via simples", responseTime: "1 dia útil", is_active: true },
  { value: "Contrato assinado pela Porto", label: "Contrato assinado pela Porto", responseTime: "7 dias úteis", is_active: true },
  { value: "Correção de cadastro - nome e estado civil", label: "Correção de cadastro - nome e estado civil", responseTime: "3 dias úteis", is_active: true },
  { value: "Devolução de valores", label: "Devolução de valores", responseTime: "10 a 15 dias úteis", is_active: true },
  { value: "Dúvidas", label: "Dúvidas", responseTime: "1 dia útil", is_active: true },
  { value: "ACESSO APP (acesso de cliente)", label: "ACESSO APP (acesso de cliente)", responseTime: "5 dias úteis", is_active: true },
  { value: "Extrato financeiro", label: "Extrato financeiro", responseTime: "1 dia útil", is_active: true },
  { value: "Inscrições ABAC", label: "Inscrições ABAC", responseTime: "1 dia útil", is_active: true },
  { value: "Link de cartão", label: "Link de cartão", responseTime: "1 dia útil", is_active: true },
  { value: "Oferta de lance", label: "Oferta de lance", responseTime: "1 dia útil", is_active: true },
  { value: "OLOLU", label: "OLOLU", responseTime: "1 dia útil", is_active: true },
  { value: "Parcela divergente", label: "Parcela divergente", responseTime: "prazo variável", is_active: true },
  { value: "Processo de transferencia", label: "Processo de transferencia", responseTime: "7 a 10 dias úteis", is_active: true },
  { value: "Simulação de redução de crédito", label: "Simulação de redução de crédito", responseTime: "Simulação 1 dia útil e Efetivação após solicitação do titular: 5 dias úteis", is_active: true },
  { value: "Simulação de rateio", label: "Simulação de rateio", responseTime: "Simulação 1 dia útil e efetivação após pagamento da multa 5 dias úteis", is_active: true },
  { value: "Simulação de aumento de crédito", label: "Simulação de aumento de crédito", responseTime: "1 dia útil", is_active: true },
  { value: "Tratativas de duplicidade de pagamento", label: "Tratativas de duplicidade de pagamento", responseTime: "10 a 15 dias úteis", is_active: true },
];

export const TICKET_STATUSES: TicketStatus[] = ["Novo", "Em Andamento", "Ativo", "Atrasado", "Porto Resolve", "Suporte", "Concluído", "Tratado"];

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
