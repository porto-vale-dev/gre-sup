import type { PosContemplacaoTicketStatus } from '@/types';

export const RESPONSAVEIS = [
    { name: 'Bruna', email: 'bruna@portovaleconsorcios.com.br' },
    { name: 'Dominik', email: 'dominik.rocha@portovaleconsorcios.com.br' },
    { name: 'Sara', email: 'apoioposcontemplacao1@portovaleconsorcios.com.br' },
    { name: 'Pedro', email: 'apoioposcontemplacao2@portovaleconsorcios.com.br' }
];

export const POS_CONTEMPLACAO_STATUSES: PosContemplacaoTicketStatus[] = ["Aberto", "Em Análise", "Concluído"];

export const MOTIVOS_POS_CONTEMPLACAO = [
    'ANALISE DE CRÉDITO',
    'ENVIO DE E-MAIL',
    'PROGRAMAÇÃO DE PAGAMENTO',
    'COMPROVANTE DE PAGAMENTO',
    'ASSEMBLEIA INAUGURAL',
    'CONFIRMAÇÃO DE CONTEMPLAÇÃO',
];
