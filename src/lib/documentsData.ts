import type { LucideIcon } from 'lucide-react';
import { FileText, Receipt, ArrowRightLeft, Car, FileSpreadsheet, Trophy } from 'lucide-react';

export interface Document {
  title: string;
  description: string;
  category: 'Financeiro';
  subCategory: string;
  Icon: LucideIcon;
  previewUrl: string;
  downloadUrl: string;
}

// Nota: Os URLs apontam para os arquivos na pasta `public/documents`
export const documentsData: Document[] = [
  {
    title: 'Solicitação de Contas a Pagar',
    description: 'Formulário para solicitação de pagamento de contas',
    category: 'Financeiro',
    subCategory: 'Contas a pagar',
    Icon: FileText,
    previewUrl: '/documents/solicitacao-contas-a-pagar.pdf',
    downloadUrl: '/documents/solicitacao-contas-a-pagar.pdf',
  },
  {
    title: 'Solicitação de Reembolso',
    description: 'Formulário para solicitação de reembolso de despesas',
    category: 'Financeiro',
    subCategory: 'Reembolso de despesas',
    Icon: Receipt,
    previewUrl: '/documents/solicitacao-reembolso.pdf',
    downloadUrl: '/documents/solicitacao-reembolso.pdf',
  },
  {
    title: 'Adiantamento de Despesas',
    description: 'Formulário para solicitação de adiantamento de despesas',
    category: 'Financeiro',
    subCategory: 'Adiantamento de despesas',
    Icon: ArrowRightLeft,
    previewUrl: '/documents/adiantamento-despesas.pdf',
    downloadUrl: '/documents/adiantamento-despesas.pdf',
  },
  {
    title: 'Locação de Veículos',
    description: 'Formulário para solicitar a locação de veículos',
    category: 'Financeiro',
    subCategory: 'Locação de veículos',
    Icon: Car,
    previewUrl: '/documents/locacao-veiculos.pdf',
    downloadUrl: '/documents/locacao-veiculos.pdf',
  },
  {
    title: 'Recebimento de Demonstrativo NF e Prestador de Serviço',
    description: 'Procedimento para recebimento de demonstrativos e notas fiscais',
    category: 'Financeiro',
    subCategory: 'Recebimento de demonstrativo NF e Prestador de serviço',
    Icon: FileSpreadsheet,
    previewUrl: '/documents/recebimento-demonstrativo-nf.pdf',
    downloadUrl: '/documents/recebimento-demonstrativo-nf.pdf',
  },
  {
    title: 'Pagamento de Premiação de Campanhas',
    description: 'Formulário para solicitação de pagamento de premiações',
    category: 'Financeiro',
    subCategory: 'Pagamento de premiação de campanhas',
    Icon: Trophy,
    previewUrl: '/documents/pagamento-premiacao-campanhas.pdf',
    downloadUrl: '/documents/pagamento-premiacao-campanhas.pdf',
  },
];