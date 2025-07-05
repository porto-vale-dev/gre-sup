import type { LucideIcon } from 'lucide-react';
import { FileText, Receipt, ArrowRightLeft, Car, FileSpreadsheet, Trophy } from 'lucide-react';

export interface Document {
  title: string;
  description: string;
  category: 'Financeiro';
  subCategory: string;
  Icon: LucideIcon;
  filePath: string;
  fileName: string;
}

// Nota: Os caminhos (filePath) são relativos ao bucket 'documentos' no Supabase.
// Ex: 'financeiro/solicitacao-contas-a-pagar.pdf'
export const documentsData: Document[] = [
  {
    title: 'Solicitação de Contas a Pagar',
    description: 'Formulário para solicitação de pagamento de contas',
    category: 'Financeiro',
    subCategory: 'Contas a pagar',
    Icon: FileText,
    filePath: 'financeiro/solicitacao-contas-a-pagar.pdf',
    fileName: 'solicitacao-contas-a-pagar.pdf',
  },
  {
    title: 'Solicitação de Reembolso',
    description: 'Formulário para solicitação de reembolso de despesas',
    category: 'Financeiro',
    subCategory: 'Reembolso de despesas',
    Icon: Receipt,
    filePath: 'financeiro/solicitacao-reembolso.pdf',
    fileName: 'solicitacao-reembolso.pdf',
  },
  {
    title: 'Adiantamento de Despesas',
    description: 'Formulário para solicitação de adiantamento de despesas',
    category: 'Financeiro',
    subCategory: 'Adiantamento de despesas',
    Icon: ArrowRightLeft,
    filePath: 'financeiro/adiantamento-despesas.pdf',
    fileName: 'adiantamento-despesas.pdf',
  },
  {
    title: 'Locação de Veículos',
    description: 'Formulário para solicitar a locação de veículos',
    category: 'Financeiro',
    subCategory: 'Locação de veículos',
    Icon: Car,
    filePath: 'financeiro/locacao-veiculos.pdf',
    fileName: 'locacao-veiculos.pdf',
  },
  {
    title: 'Recebimento de Demonstrativo NF e Prestador de Serviço',
    description: 'Procedimento para recebimento de demonstrativos e notas fiscais',
    category: 'Financeiro',
    subCategory: 'Recebimento de demonstrativo NF e Prestador de serviço',
    Icon: FileSpreadsheet,
    filePath: 'financeiro/recebimento-demonstrativo-nf.pdf',
    fileName: 'recebimento-demonstrativo-nf.pdf',
  },
  {
    title: 'Pagamento de Premiação de Campanhas',
    description: 'Formulário para solicitação de pagamento de premiações',
    category: 'Financeiro',
    subCategory: 'Pagamento de premiação de campanhas',
    Icon: Trophy,
    filePath: 'financeiro/pagamento-premiacao-campanhas.pdf',
    fileName: 'pagamento-premiacao-campanhas.pdf',
  },
];
