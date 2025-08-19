import type { LucideIcon } from 'lucide-react';
import { FileText, Receipt, ArrowRightLeft, Car, FileSpreadsheet, Trophy, Ship } from 'lucide-react';

export interface Document {
  title: string;
  description: string;
  category: 'Financeiro' | 'COMEX';
  subCategory: string;
  Icon: LucideIcon;
  pathInBucket: string; // The path to the file within the Supabase bucket
  fileName: string; // The desired name for the downloaded file
}

export const documentsData: Document[] = [
  // Financeiro
  {
    title: 'Solicitação de Contas a Pagar',
    description: 'Formulário para solicitação de pagamento de contas',
    category: 'Financeiro',
    subCategory: 'Contas a pagar',
    Icon: FileText,
    fileName: 'contas-a-pagar.pdf',
    pathInBucket: 'financeiro/contas-a-pagar.pdf',
  },
  {
    title: 'Solicitação de Reembolso',
    description: 'Formulário para solicitação de reembolso de despesas',
    category: 'Financeiro',
    subCategory: 'Reembolso de despesas',
    Icon: Receipt,
    fileName: 'solicitacao-reembolso-despesas.pdf',
    pathInBucket: 'financeiro/solicitacao-reembolso-despesas.pdf',
  },
  {
    title: 'Adiantamento de Despesas',
    description: 'Formulário para solicitação de adiantamento de despesas',
    category: 'Financeiro',
    subCategory: 'Adiantamento de despesas',
    Icon: ArrowRightLeft,
    fileName: 'solicitacao-de-adiantamento.pdf',
    pathInBucket: 'financeiro/solicitacao-de-adiantamento.pdf',
  },
  {
    title: 'Locação de Veículos',
    description: 'Formulário para solicitar a locação de veículos',
    category: 'Financeiro',
    subCategory: 'Locação de veículos',
    Icon: Car,
    fileName: 'solicitacao-locacao-veiculos.pdf',
    pathInBucket: 'financeiro/solicitacao-locacao-veiculos.pdf',
  },
  {
    title: 'Recebimento de Demonstrativo NF',
    description: 'Procedimento para recebimento de demonstrativos e notas fiscais',
    category: 'Financeiro',
    subCategory: 'Recebimento de demonstrativo NF e Prestador de serviço',
    Icon: FileSpreadsheet,
    fileName: 'recebimento-de-demonstrativo.pdf',
    pathInBucket: 'financeiro/recebimento-de-demonstrativo.pdf',
  },
  {
    title: 'Pagamento de Premiação',
    description: 'Formulário para solicitação de pagamento de premiações',
    category: 'Financeiro',
    subCategory: 'Pagamento de premiação de campanhas',
    Icon: Trophy,
    fileName: 'solicitacao-pagamento-premiacao.pdf',
    pathInBucket: 'financeiro/solicitacao-pagamento-premiacao.pdf',
  },
  // COMEX - Relatórios Gerais
  {
    title: 'Relatório COMEX - Fevereiro 2025',
    description: 'Relatório geral de Comércio Exterior de Fevereiro de 2025.',
    category: 'COMEX',
    subCategory: 'Relatórios Gerais',
    Icon: FileText,
    fileName: 'Comex_0225.pdf',
    pathInBucket: 'comex/Comex_0225.pdf',
  },
  {
    title: 'Relatório COMEX - Março 2025',
    description: 'Relatório geral de Comércio Exterior de Março de 2025.',
    category: 'COMEX',
    subCategory: 'Relatórios Gerais',
    Icon: FileText,
    fileName: 'Comex_0325.pdf',
    pathInBucket: 'comex/Comex_0325.pdf',
  },
  {
    title: 'Relatório COMEX - Abril 2025',
    description: 'Relatório geral de Comércio Exterior de Abril de 2025.',
    category: 'COMEX',
    subCategory: 'Relatórios Gerais',
    Icon: FileText,
    fileName: 'Comex_0425.pdf',
    pathInBucket: 'comex/Comex_0425.pdf',
  },
  {
    title: 'Relatório COMEX - Maio 2025',
    description: 'Relatório geral de Comércio Exterior de Maio de 2025.',
    category: 'COMEX',
    subCategory: 'Relatórios Gerais',
    Icon: FileText,
    fileName: 'Comex_0525.pdf',
    pathInBucket: 'comex/Comex_0525.pdf',
  },
  {
    title: 'Relatório COMEX - Junho 2025',
    description: 'Relatório geral de Comércio Exterior de Junho de 2025.',
    category: 'COMEX',
    subCategory: 'Relatórios Gerais',
    Icon: FileText,
    fileName: 'Comex_0625.pdf',
    pathInBucket: 'comex/Comex_0625.pdf',
  },
  {
    title: 'Relatório COMEX - Julho 2025',
    description: 'Relatório geral de Comércio Exterior de Julho de 2025.',
    category: 'COMEX',
    subCategory: 'Relatórios Gerais',
    Icon: FileText,
    fileName: 'Comex_0725.pdf',
    pathInBucket: 'comex/Comex_0725.pdf',
  },
  {
    title: 'Relatório COMEX - Agosto 2025',
    description: 'Relatório geral de Comércio Exterior de Agosto de 2025.',
    category: 'COMEX',
    subCategory: 'Relatórios Gerais',
    Icon: FileText,
    fileName: 'Comex_0825.pdf',
    pathInBucket: 'comex/Comex_0825.pdf',
  },
  // COMEX - Comex Board
  {
    title: 'Board COMEX - Março 2025',
    description: 'Apresentação do Board de Comércio Exterior de Março de 2025.',
    category: 'COMEX',
    subCategory: 'Comex Board',
    Icon: FileSpreadsheet,
    fileName: 'BOARD_0325.pdf',
    pathInBucket: 'comex/comex_board/BOARD_0325.pdf',
  },
  {
    title: 'Board COMEX - Abril 2025',
    description: 'Apresentação do Board de Comércio Exterior de Abril de 2025.',
    category: 'COMEX',
    subCategory: 'Comex Board',
    Icon: FileSpreadsheet,
    fileName: 'BOARD_0425.pdf',
    pathInBucket: 'comex/comex_board/BOARD_0425.pdf',
  },
  {
    title: 'Board COMEX - Maio 2025',
    description: 'Apresentação do Board de Comércio Exterior de Maio de 2025.',
    category: 'COMEX',
    subCategory: 'Comex Board',
    Icon: FileSpreadsheet,
    fileName: 'BOARD_0525.pdf',
    pathInBucket: 'comex/comex_board/BOARD_0525.pdf',
  },
  {
    title: 'Board COMEX - Junho 2025',
    description: 'Apresentação do Board de Comércio Exterior de Junho de 2025.',
    category: 'COMEX',
    subCategory: 'Comex Board',
    Icon: FileSpreadsheet,
    fileName: 'BOARD_0625.pdf',
    pathInBucket: 'comex/comex_board/BOARD_0625.pdf',
  },
  {
    title: 'Board COMEX - Julho 2025',
    description: 'Apresentação do Board de Comércio Exterior de Julho de 2025.',
    category: 'COMEX',
    subCategory: 'Comex Board',
    Icon: FileSpreadsheet,
    fileName: 'BOARD_0725.pdf',
    pathInBucket: 'comex/comex_board/BOARD_0725.pdf',
  },
  {
    title: 'Board COMEX - Agosto 2025',
    description: 'Apresentação do Board de Comércio Exterior de Agosto de 2025.',
    category: 'COMEX',
    subCategory: 'Comex Board',
    Icon: FileSpreadsheet,
    fileName: 'BOARD_0825.pdf',
    pathInBucket: 'comex/comex_board/BOARD_0825.pdf',
  },
];
