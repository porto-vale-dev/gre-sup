
import type { CobrancaTicketStatus } from '@/types';

export interface Diretor {
  name: string;
  email: string;
}

export interface Gerente {
  name: string;
  email: string;
  celular: string | null;
}

export const diretores: Diretor[] = [
  { name: 'ATENAS - DENISE', email: 'denise@portovaleconsorcios.com.br' },
  { name: 'FÊNIX - ERICA MACEDO', email: 'erica@portovaleconsorcios.com.br' },
  { name: 'EAGLES - SIMONE LAGO', email: 'simone@portovaleconsorcios.com.br' },
  { name: 'DIAMANTES - VÂNIA MONTEIRO', email: 'vania@portovaleconsorcios.com.br' },
  { name: 'DUNAMIS - ROGÉRIO BIDUSCHI', email: 'rogerio.biduschi@portovaleconsorcios.com.br' },
  { name: 'ZARA - CYNTHIA NOGUEIRA', email: 'cynthia.nogueira@portovaleconsorcios.com.br' },
  { name: 'ANJOS - SIMONE ANJOS', email: 'simone.anjos@portovaleconsorcios.com.br' },
  // { name: 'ABRAAO', email: 'abraao@portovaleconsorcios.com.br' },
  // { name: 'LUCIANA', email: 'luciana@portovaleconsorcios.com.br' },
];

export const gerentesPorDiretor: Record<string, Gerente[]> = {
  'ATENAS - DENISE': [
    { name: 'DENISE', email: 'denise@portovaleconsorcios.com.br', celular: '+5512991055065'},
    { name: 'ANA DIAS', email: 'anadias@portovaleconsorcios.com.br', celular: '+55 11 97688-2961' },
    { name: 'MARCUS PATTO', email: 'marcus.patto@portovaleconsorcios.com.br', celular: '+55 12 99654-7691' },
    { name: 'MONICA BORGES', email: 'monica.borges@portovaleconsorcios.com.br', celular: '+55 12 99798-8490' },
    { name: 'CLAYTON CARVALHO', email: 'clayton.carvalho@portovaleconsorcios.com.br', celular: '+55 12 98806-8834' },
    { name: 'ANA PAULA SILVA', email: 'ana.silva@portovaleconsorcios.com.br', celular: '+55 11 99628-9396' },
    { name: 'RAFAELA GALDINO', email: 'rafaela.galdino@portovaleconsorcios.com.br', celular: '+55 12 99666-2441' },
    { name: 'PRISCILA APARECIDA', email: 'priscila.aparecida@portovaleconsorcios.com.br', celular: '+55 12 98830-0920' },
    { name: 'CAROLINA HORIE', email: 'carolina.castro@portovaleconsorcios.com.br', celular: '+55 12 99726-6484' },
  ],
  'FÊNIX - ERICA MACEDO': [
    { name: 'ERICA MACEDO', email: 'erica@portovaleconsorcios.com.br', celular:'+5519991116713'},
    { name: 'TAINÁ LOPES', email: 'taina@portovaleconsorcios.com.br', celular: '+55 12 99633-5737' },
    { name: 'VANESSA RODRIGUES', email: 'vanessa.rodrigues@portovaleconsorcios.com.br', celular: '+55 12 98145-4409' },
    { name: 'FERNANDA VIANA', email: 'fernanda.viana@portovaleconsorcios.com.br', celular: '+55 12 99210-9671' },
    { name: 'RUANA GOMES', email: 'ruana.gomes@portovaleconsorcios.com.br', celular: '+55 35 9824-6113' },
    { name: 'CAROLINA CARVALHO', email: 'carolina.carvalho@portovaleconsorcios.com.br', celular: '+55 12 99774-3096' },
    { name: 'SAMARA MARQUES', email: 'samara.marques@portovaleconsorcios.com.br', celular: '+55 12 97410-0847' },
    { name: 'ISABELA BUENO', email: 'isabela.bueno@portovaleconsorcios.com.br', celular: '+55 12 99635-4686' },
  ],
  'EAGLES - SIMONE LAGO': [
    { name: 'SIMONE LAGO', email: 'simone@portovaleconsorcios.com.br', celular: '+5512976002769' },
    { name: 'LARA REIS', email: 'lara.reis@portovaleconsorcios.com.br', celular: '+55 12 98833-1906' },
    { name: 'FLAVIA RODRIGUES', email: 'flavia.rodrigues@portovaleconsorcios.com.br', celular: '+55 12 98115-6337' },
    { name: 'MICHELE FRANÇA', email: 'michelle.franca@portovaleconsorcios.com.br', celular: '+55 12 98815-2071' },
    { name: 'CAROL FRANÇA', email: 'carolina.franca@portovaleconsorcios.com.br', celular: '+55 12 99241-6767' },
    { name: 'DANIELLE SILVA', email: 'danielle.silva@portovaleconsorcios.com.br', celular: '+55 11 91536-8239' },
    { name: 'ERICK MARTINS', email: 'erick.martins@portovaleconsorcios.com.br', celular: '+55 11 99831-1811' },
    { name: 'SUELLEN VILELA', email: 'suellen.vilela@portovaleconsorcios.com.br', celular: '+5512997328911' },
  ],
  'DIAMANTES - VÂNIA MONTEIRO': [
    { name: 'VÂNIA MONTEIRO', email: 'vania@portovaleconsorcios.com.br', celular: '+5512982315868' },
    { name: 'MILKA MOURA', email: 'milka@portovaleconsorcios.com.br', celular: '+55 12 99652-3452' },
    { name: 'PATRICIA RODRIGUES', email: 'patricia@portovaleconsorcios.com.br', celular: '+55 12 98815-7351' },
    { name: 'KAROLINE NOGUEIRA', email: 'karol.nogueira@portovaleconsorcios.com.br', celular: '+55 12 99770-2182' },
    { name: 'SUELLEN RODRIGUES', email: 'suellen.rodrigues@portovaleconsorcios.com.br', celular: '+55 12 99716-7008' },
    { name: 'REGIANE ALVES', email: 'regiane.alves@portovaleconsorcios.com.br', celular: '+55 12 99762-1636' },
    { name: 'JULIO CESAR', email: 'julio.cesar@portovaleconsorcios.com.br', celular: '+55 11 91584-1984' },
    { name: 'ELTON FERRAZ', email: 'elton.ferraz@portovaleconsorcios.com.br', celular: '+55 12 99602-2764' },
  ],
  'DUNAMIS - ROGÉRIO BIDUSCHI': [
    { name: 'ROGÉRIO BIDUSCHI', email: 'rogerio.biduschi@portovaleconsorcios.com.br', celular: '+5511947337291' },
    { name: 'CAIO VILELA', email: 'caio.vilela@portovaleconsorcios.com.br', celular: '+55 11 92065-3092' },
    { name: 'WELLINGTON FERRI', email: 'wellington.ferri@portovaleconsorcios.com.br', celular: '+55 11 94781-5287' },
    { name: 'JESSICA PACIÊNCIA', email: 'jessica.paciencia@portovaleconsorcios.com.br', celular: '+55 11 94000-6560' },
    { name: 'BRUNA MANTOVANI', email: 'bruna.mantovani@portovaleconsorcios.com.br', celular: '+55 11 99149-2828' },
    { name: 'GEOVANNA SOBRAL', email: 'geovanna.sobral@portovaleconsorcios.com.br', celular: '+55 11 91319-0073' },
  ],
  'ZARA - CYNTHIA NOGUEIRA': [
    { name: 'CYNTHIA NOGUEIRA', email: 'cynthia.nogueira@portovaleconsorcios.com.br', celular: '+5512982640998' },
    { name: 'PAMELA UCHOAS', email: 'pamela.uchoas@portovaleconsorcios.com.br', celular: '+55 12 99149-5877' },
    { name: 'FELIPE NAGAHASHI', email: 'felipe.nagahashi@portovaleconsorcios.com.br', celular: '+55 12 98176-7144' },
    { name: 'ROSA MARIA RODRIGUES', email: 'rosa.maria@portovaleconsorcios.com.br', celular: '+55 12 98226-6964' },
    { name: 'EVELINE SIQUEIRA', email: 'eveline.siqueira@portovaleconsorcios.com.br', celular: '+55 12 98809-2963' },
  ],
  'ANJOS - SIMONE ANJOS': [
    { name: 'ANJOS - SIMONE ANJOS', email: 'simone.anjos@portovaleconsorcios.com.br', celular: '+5511915880502' },
    { name: 'DAIANE LIMA', email: 'daiane.lima@portovaleconsorcios.com.br', celular: '+55 12 99162-5157' },
    { name: 'LUCIANO AUGUSTO', email: 'luciano.augusto@portovaleconsorcios.com.br', celular: '+55 11 97161-9503' },
    { name: 'FLAVIA MOTTA', email: 'flavia.motta@portovaleconsorcios.com.br', celular: '+55 12 99152-2893' },
    { name: 'VANESSA MENDES', email: 'vanessa.mendes@portovaleconsorcios.com.br', celular: '+55 12 98159-1330' },
    { name: 'PAULA MAROLLO', email: 'paula.marollo@portovaleconsorcios.com.br', celular: '+55 12 99219-0387' },
    { name: 'ROSEMARY RIBEIRO', email: 'rosemary.ribeiro@portovaleconsorcios.com.br', celular: '+55 12 99135-7506' },
  ],
  // 'LUCIANA': [
  //   { name: 'LUCIANA', email: 'luciana@portovaleconsorcios.com.br', celular: '+55 12 98815-8841' },
  // ]
  
  // 'ABRAAO': [
  //   { name: 'ABRAAO', email: 'abraao@portovaleconsorcios.com.br', celular: '+55 12 3600-3505' },
  // ]
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

export const COBRANCA_TICKET_STATUSES = [
    "Aberta",
    "Em análise",
    "Encaminhada",
    "Respondida",
    "Reabertura",
    "Resolvida",
];
