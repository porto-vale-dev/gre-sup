import type { PosContemplacaoTicketStatus } from '@/types';

export interface Responsavel {
    name: string;
    email: string;
    celular: string | null;
}

export const RESPONSAVEIS: Responsavel[] = [
    { name: 'Bruna', email: 'bruna@portovaleconsorcios.com.br', celular: '+5512997289218' },
    { name: 'Dominik', email: 'dominik.rocha@portovaleconsorcios.com.br', celular: '1235122064' },
    { name: 'Sara', email: 'apoioposcontemplacao1@portovaleconsorcios.com.br', celular: '1220181191' },
    { name: 'Pedro', email: 'apoioposcontemplacao2@portovaleconsorcios.com.br', celular: '1220181189' }
];

export const POS_CONTEMPLACAO_STATUSES: PosContemplacaoTicketStatus[] = ["Aberto", "Em Análise", "Urgente", "Retorno", "Concluído"];

export const MOTIVOS_POS_CONTEMPLACAO = [
    'ANALISE DE CRÉDITO',
    'ENVIO DE E-MAIL',
    'PROGRAMAÇÃO DE PAGAMENTO',
    'COMPROVANTE DE PAGAMENTO',
    'ASSEMBLEIA INAUGURAL',
    'CONFIRMAÇÃO DE CONTEMPLAÇÃO',
    'BANK RESOLVE',
    'ASSESSORIA JURIDICA',
];
