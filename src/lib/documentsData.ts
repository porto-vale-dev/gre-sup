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

// Nota: Os URLs apontam para um placeholder. Os arquivos reais precisam ser adicionados na pasta `public/documents`
const placeholderUrl = '/documents/placeholder.pdf';

export const documentsData: Document[] = [
  {
    title: 'Solicitação de Contas a Pagar',
    description: 'Formulário para solicitação de pagamento de contas',
    category: 'Financeiro',
    subCategory: 'Contas a pagar',
    Icon: FileText,
    previewUrl: placeholderUrl,
    downloadUrl: placeholderUrl,
  },
  {
    title: 'Solicitação de Reembolso',
    description: 'Formulário para solicitação de reembolso de despesas',
    category: 'Financeiro',
    subCategory: 'Reembolso de despesas',
    Icon: Receipt,
    previewUrl: placeholderUrl,
    downloadUrl: placeholderUrl,
  },
  {
    title: 'Adiantamento de Despesas',
    description: 'Formulário para solicitação de adiantamento de despesas',
    category: 'Financeiro',
    subCategory: 'Adiantamento de despesas',
    Icon: ArrowRightLeft,
    previewUrl: placeholderUrl,
    downloadUrl: placeholderUrl,
  },
  {
    title: 'Locação de Veículos',
    description: 'Formulário para solicitar a locação de veículos',
    category: 'Financeiro',
    subCategory: 'Locação de veículos',
    Icon: Car,
    previewUrl: placeholderUrl,
    downloadUrl: placeholderUrl,
  },
  {
    title: 'Recebimento de Demonstrativo NF e Prestador de Serviço',
    description: 'Procedimento para recebimento de demonstrativos e notas fiscais',
    category: 'Financeiro',
    subCategory: 'Recebimento de demonstrativo NF e Prestador de serviço',
    Icon: FileSpreadsheet,
    previewUrl: placeholderUrl,
    downloadUrl: placeholderUrl,
  },
  {
    title: 'Pagamento de Premiação de Campanhas',
    description: 'Formulário para solicitação de pagamento de premiações',
    category: 'Financeiro',
    subCategory: 'Pagamento de premiação de campanhas',
    Icon: Trophy,
    previewUrl: placeholderUrl,
    downloadUrl: placeholderUrl,
  },
];
