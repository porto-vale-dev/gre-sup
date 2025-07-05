import type { LucideIcon } from 'lucide-react';
import { FileText, Receipt, ArrowRightLeft, Car, FileSpreadsheet, Trophy } from 'lucide-react';

export interface Document {
  title: string;
  description: string;
  category: 'Financeiro';
  subCategory: string;
  Icon: LucideIcon;
  fileName: string;
  publicUrl: string; // The direct public URL to the file in Supabase Storage
}

// NOTE: This logic assumes your 'documentos' bucket in Supabase is public.
const SUPABASE_PROJECT_URL = 'https://dzbsqlutdjwabgjuhsin.supabase.co'; // Extracted from your link
const BUCKET_PATH = 'storage/v1/object/public/documentos';

export const documentsData: Document[] = [
  {
    title: 'Solicitação de Contas a Pagar',
    description: 'Formulário para solicitação de pagamento de contas',
    category: 'Financeiro',
    subCategory: 'Contas a pagar',
    Icon: FileText,
    fileName: 'contas-a-pagar.pdf',
    publicUrl: `${SUPABASE_PROJECT_URL}/${BUCKET_PATH}/financeiro/contas-a-pagar.pdf`,
  },
  {
    title: 'Solicitação de Reembolso',
    description: 'Formulário para solicitação de reembolso de despesas',
    category: 'Financeiro',
    subCategory: 'Reembolso de despesas',
    Icon: Receipt,
    fileName: 'solicitcao-reembolso-despesas.pdf',
    publicUrl: `${SUPABASE_PROJECT_URL}/${BUCKET_PATH}/financeiro/solicitcao-reembolso-despesas.pdf`,
  },
  {
    title: 'Adiantamento de Despesas',
    description: 'Formulário para solicitação de adiantamento de despesas',
    category: 'Financeiro',
    subCategory: 'Adiantamento de despesas',
    Icon: ArrowRightLeft,
    fileName: 'solicitacao-de-adiantamento.pdf',
    publicUrl: `${SUPABASE_PROJECT_URL}/${BUCKET_PATH}/financeiro/solicitacao-de-adiantamento.pdf`,
  },
  {
    title: 'Locação de Veículos',
    description: 'Formulário para solicitar a locação de veículos',
    category: 'Financeiro',
    subCategory: 'Locação de veículos',
    Icon: Car,
    fileName: 'solicitacao-locacao-veiculos.pdf',
    publicUrl: `${SUPABASE_PROJECT_URL}/${BUCKET_PATH}/financeiro/solicitacao-locacao-veiculos.pdf`,
  },
  {
    title: 'Recebimento de Demonstrativo NF e Prestador de Serviço',
    description: 'Procedimento para recebimento de demonstrativos e notas fiscais',
    category: 'Financeiro',
    subCategory: 'Recebimento de demonstrativo NF e Prestador de serviço',
    Icon: FileSpreadsheet,
    fileName: 'recebimento-de-demonstrativo.pdf',
    publicUrl: `${SUPABASE_PROJECT_URL}/${BUCKET_PATH}/financeiro/recebimento-de-demonstrativo.pdf`,
  },
  {
    title: 'Pagamento de Premiação de Campanhas',
    description: 'Formulário para solicitação de pagamento de premiações',
    category: 'Financeiro',
    subCategory: 'Pagamento de premiação de campanhas',
    Icon: Trophy,
    fileName: 'solicitacao-pagamento-premiacao.pdf',
    publicUrl: `${SUPABASE_PROJECT_URL}/${BUCKET_PATH}/financeiro/solicitacao-pagamento-premiacao.pdf`,
  },
];
