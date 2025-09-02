
import type { CobrancaTicketStatus } from '@/types';

export interface Diretor {
  name: string;
  email: string;
}

export interface Gerente {
  name: string;
  email: string;
}

export const diretores: Diretor[] = [
  { name: 'ATENAS - DENISE', email: 'denise@portovaleconsorcios.com.br' },
  { name: 'FÊNIX - ERICA MACEDO', email: 'erica@portovaleconsorcios.com.br' },
  { name: 'EAGLES - SIMONE LAGO', email: 'simone@portovaleconsorcios.com.br' },
  { name: 'DIAMANTES - VÂNIA MONTEIRO', email: 'vania@portovaleconsorcios.com.br' },
  { name: 'DUNAMIS - ROGÉRIO BIDUSCHI', email: 'rogerio.biduschi@portovaleconsorcios.com.br' },
  { name: 'ZARA - CYNTHIA NOGUEIRA', email: 'cynthia.nogueira@portovaleconsorcios.com.br' },
  { name: 'ANJOS - SIMONE ANJOS', email: 'simone.anjos@portovaleconsorcios.com.br' },
  { name: 'LUCIANA', email: 'luciana@portovaleconsorcios.com.br' },
];

export const gerentesPorDiretor: Record<string, Gerente[]> = {
  'ATENAS - DENISE': [
    { name: 'ANA DIAS', email: 'anadias@portovaleconsorcios.com.br' },
    { name: 'MARCUS PATTO', email: 'marcus.patto@portovaleconsorcios.com.br' },
    { name: 'MONICA BORGES', email: 'monica.borges@portovaleconsorcios.com.br' },
    { name: 'CLAYTON CARVALHO', email: 'clayton.carvalho@portovaleconsorcios.com.brc' },
    { name: 'ANA PAULA SILVA', email: 'ana.silva@portovaleconsorcios.com.br' },
    { name: 'RAFAELA GALDINO', email: 'rafaela.galdino@portovaleconsorcios.com.br' },
  ],
  'FÊNIX - ERICA MACEDO': [
    { name: 'TAINÁ LOPES', email: 'taina@portovaleconsorcios.com.br' },
    { name: 'VANESSA RODRIGUES', email: 'vanessa.rodrigues@portovaleconsorcios.com.br' },
    { name: 'FERNANDA VIANA', email: 'fernanda.viana@portovaleconsorcios.com.br' },
    { name: 'RUANA GOMES', email: 'ruana.gomes@portovaleconsorcios.com.br' },
    { name: 'CAROLINA CARVALHO', email: 'carolina.carvalho@portovaleconsorcios.com.br' },
    { name: 'SAMARA MARQUES', email: 'samara.marques@portovaleconsorcios.com.br' },
    { name: 'ISABELA BUENO', email: 'isabela.bueno@portovaleconsorcios.com.br' },
  ],
  'EAGLES - SIMONE LAGO': [
    { name: 'LARA REIS', email: 'lara.reis@portovaleconsorcios.com.br' },
    { name: 'FLAVIA RODRIGUES', email: 'flavia.rodrigues@portovaleconsorcios.com.br' },
    { name: 'MICHELE FRANÇA', email: 'michelle.franca@portovaleconsorcios.com.br' },
    { name: 'CAROL FRANÇA', email: 'carolina.franca@portovaleconsorcios.com.br' },
    { name: 'DANIELLE SILVA', email: 'danielle.silva@portovaleconsorcios.com.br' },
    { name: 'CAROLINA HORIE', email: 'carolina.castro@portovaleconsorcios.com.br' },
    { name: 'ERICK MARTINS', email: 'erick.martins@portovaleconsorcios.com.br' },
  ],
  'DIAMANTES - VÂNIA MONTEIRO': [
    { name: 'MILKA MOURA', email: 'milka@portovaleconsorcios.com.br' },
    { name: 'PATRICIA RODRIGUES', email: 'patricia@portovaleconsorcios.com.br' },
    { name: 'KAROLINE NOGUEIRA', email: 'karol.nogueira@portovaleconsorcios.com.br' },
    { name: 'SUELLEN RODRIGUES', email: 'suellen.rodrigues@portovaleconsorcios.com.br' },
    { name: 'REGIANE ALVES', email: 'regiane.alves@portovaleconsorcios.com.br' },
    { name: 'JULIO CESAR', email: 'julio.cesar@portovaleconsorcios.com.br' },
    { name: 'ELTON FERRAZ', email: 'elton.ferraz@portovaleconsorcios.com.br' },
  ],
  'DUNAMIS - ROGÉRIO BIDUSCHI': [
    { name: 'CAIO VILELA', email: 'caio.vilela@portovaleconsorcios.com.br' },
    { name: 'WELLINGTON FERRI', email: 'wellington.ferri@portovaleconsorcios.com.br' },
    { name: 'JESSICA PACIÊNCIA', email: 'jessica.paciencia@portovaleconsorcios.com.br' },
    { name: 'BRUNO MURIEL', email: 'bruno.muriel@portovaleconsorcios.com.br' },
    { name: 'BRUNA MANTOVANI', email: 'bruna.mantovani@portovaleconsorcios.com.br' },
    { name: 'GEOVANNA SOBRAL', email: 'geovanna.sobral@portovaleconsorcios.com.br' },
  ],
  'ZARA - CYNTHIA NOGUEIRA': [
    { name: 'PAMELA UCHOAS', email: 'pamela.uchoas@portovaleconsorcios.com.br' },
    { name: 'FELIPE NAGAHASHI', email: 'felipe.nagahashi@portovaleconsorcios.com.br' },
    { name: 'ROSA MARIA RODRIGUES', email: 'rosa.maria@portovaleconsorcios.com.br' },
    { name: 'EVELINE SIQUEIRA', email: 'eveline.siqueira@portovaleconsorcios.com.br' },
  ],
  'ANJOS - SIMONE ANJOS': [
    { name: 'DAIANE LIMA', email: 'daiane.lima@portovaleconsorcios.com.br' },
    { name: 'LUCIANO AUGUSTO', email: 'luciano.augusto@portovaleconsorcios.com.br' },
    { name: 'FLAVIA MOTTA', email: 'flavia.motta@portovaleconsorcios.com.br' },
    { name: 'VANESSA MENDES', email: 'vanessa.mendes@portovaleconsorcios.com.br' },
    { name: 'PAULA MAROLLO', email: 'paula.marollo@portovaleconsorcios.com.br' },
    { name: 'ROSEMARY RIBEIRO', email: 'rosemary.ribeiro@portovaleconsorcios.com.br' },
  ],
  'LUCIANA': [
    { name: 'LUCIANA', email: 'luciana@portovaleconsorcios.com.br' },
  ]
};

export const motivosCobranca = [
    'Cancelamento da cota',
    'Auxílio a Dúvidas Gerais',
    'Lances',
    'Valores de parcela',
    'Solicitar Contato de Consultor',
    'Reclamação / Sem Retorno',
];

export const RETORNO_COMERCIAL_STATUSES = [
    'Tirou dúvidas',
    'Tentando contato',
    'Em andamento',
    'Revertido',
    'Não Revertido',
    'Sem retorno'
];

export const COBRANCA_TICKET_STATUSES: CobrancaTicketStatus[] = [
    "Aberta",
    "Em análise",
    "Encaminhada",
    "Resolvida",
    "Dentro do prazo",
    "Fora do prazo"
];
