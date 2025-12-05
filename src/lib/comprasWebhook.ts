import type { ComprasTicket } from '@/types';

const WEBHOOK_URL = 'https://n8n.portovaleconsorcio.com.br/webhook/f2edbccd-7b12-48dd-b722-a0e46c1352c0';

function mapToWebhookPayload(ticket: ComprasTicket) {
  return {
    ID: ticket.id,
    DATA: ticket.created_at,
    PRODUTO: ticket.produto,
    QUANTIDADE_PRODUTO: ticket.quantidade,
    TOTAL: ticket.total,
    TAMANHO: ticket.tamanho ?? '',
    RETIRADA: ticket.retirada,
    DESCONTADO_FOLHA: ticket.folha,
    EMAIL_SOLICITANTE: ticket.email,
    TELEFONE: ticket.telefone ?? '',
    APROVADO: ticket.aprovado,
    APROVADO_POR: ticket.usuario_compras ?? '',
    ENTREGUE: ticket.entrega,
    ENTREGADOR: ticket.entregador ?? '',
  };
}

export async function sendComprasWebhook(ticket: ComprasTicket) {
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mapToWebhookPayload(ticket)),
    });
  } catch (error) {
    console.error('Failed to send compras webhook', error);
  }
}
