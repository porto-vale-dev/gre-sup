"use client";

import type { ComprasTicket } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarDays, 
  Package, 
  User, 
  Mail, 
  MapPin, 
  FileText,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useComprasTickets } from '@/contexts/ComprasTicketContext';
import { useToast } from '@/hooks/use-toast';

interface ComprasTicketDetailsModalProps {
  ticket: ComprasTicket;
  onClose: () => void;
  currentUser: string;
  groupItems?: Array<{ id: number; produto: string; quantidade: number; tamanho?: string | null; total: string }>;
  groupMeta?: { createdAtDisplay: string; email: string; retirada: string; folha: boolean; aprovado: boolean | null; usuario_compras?: string | null };
}

const getStatusDisplay = (aprovado: boolean | null) => {
  if (aprovado === null) return { label: "Pendente", color: "bg-yellow-500" };
  if (aprovado === true) return { label: "Aprovado", color: "bg-green-500" };
  return { label: "Reprovado", color: "bg-red-500" };
};

export function ComprasTicketDetailsModal({ ticket, onClose, currentUser, groupItems, groupMeta }: ComprasTicketDetailsModalProps) {
  const { updateTicketStatus } = useComprasTickets();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const statusInfo = getStatusDisplay((groupMeta?.aprovado ?? (ticket.aprovado ?? null)));
  const displayDate = groupMeta?.createdAtDisplay ?? (ticket.created_at 
    ? format(parseISO(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) 
    : 'N/A');
  const isGroup = Boolean(groupItems && groupItems.length > 0);
  const groupTotal = isGroup ? groupItems!.reduce((sum, it) => sum + parseFloat(it.total || '0'), 0) : 0;

  const handleApprove = async () => {
    setIsProcessing(true);
    if (isGroup) {
      const ids = groupItems!.map(i => i.id);
      const results = await Promise.all(ids.map(id => updateTicketStatus(id, true, currentUser)));
      const success = results.every(Boolean);
      if (success) {
        toast({ title: 'Aprovado', description: `Aprovados ${ids.length} itens do pedido.` });
        onClose();
      } else {
        toast({ title: 'Falha ao aprovar', variant: 'destructive', description: 'Alguns itens não foram aprovados.' });
      }
    } else {
      const success = await updateTicketStatus(ticket.id, true, currentUser);
      if (success) {
        onClose();
      }
    }
    setIsProcessing(false);
  };

  const handleReject = async () => {
    const confirmed = window.confirm(isGroup ? `Tem certeza que deseja reprovar TODOS os ${groupItems!.length} itens deste pedido?` : 'Tem certeza que deseja reprovar este pedido?');
    if (!confirmed) return;

    setIsProcessing(true);
    if (isGroup) {
      const ids = groupItems!.map(i => i.id);
      const results = await Promise.all(ids.map(id => updateTicketStatus(id, false, currentUser)));
      const success = results.every(Boolean);
      if (success) {
        toast({ title: 'Reprovado', description: `Reprovados ${ids.length} itens do pedido.` });
        onClose();
      } else {
        toast({ title: 'Falha ao reprovar', variant: 'destructive', description: 'Alguns itens não foram reprovados.' });
      }
    } else {
      const success = await updateTicketStatus(ticket.id, false, currentUser);
      if (success) {
        onClose();
      }
    }
    setIsProcessing(false);
  };

  const isPending = ticket.aprovado === null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Pedido #{(groupItems?.[0]?.id ?? ticket.id)}
            </DialogTitle>
            <Badge className={`${statusInfo.color} text-white`}>
              {statusInfo.label}
            </Badge>
          </div>
          <DialogDescription>
            Detalhes completos do pedido de compra
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Data e Hora */}
          <div className="flex items-start gap-3">
            <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Data do Pedido</p>
              <p className="text-sm text-muted-foreground">{displayDate}</p>
            </div>
          </div>

          <Separator />

          {/* Informações do Produto */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Informações do Produto
            </h3>
            <div className="space-y-2 pl-6">
              {isGroup ? (
                <>
                  <div className="text-sm font-medium">Itens do Pedido</div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {groupItems!.map((it) => (
                      <div key={it.id}>
                        {it.produto} — Qty: {it.quantidade}{it.tamanho ? ` — ${it.tamanho}` : ''} — R$ {parseFloat(it.total).toFixed(2)}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-sm font-medium">Itens</p>
                      <p className="text-sm text-muted-foreground">{groupItems!.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total do Pedido</p>
                      <p className="text-sm text-muted-foreground">R$ {groupTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium">Produto</p>
                    <p className="text-sm text-muted-foreground">{ticket.produto}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Quantidade</p>
                      <p className="text-sm text-muted-foreground">{ticket.quantidade}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total</p>
                      <p className="text-sm text-muted-foreground">
                        R$ {parseFloat(ticket.total).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {ticket.tamanho && (
                    <div>
                      <p className="text-sm font-medium">Tamanho/Variação</p>
                      <p className="text-sm text-muted-foreground">{ticket.tamanho}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Informações do Solicitante */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações do Solicitante
            </h3>
            <div className="space-y-2 pl-6">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{groupMeta?.email ?? ticket.email}</p>
                </div>
              </div>
              {ticket.telefone && (
                <div>
                  <p className="text-sm font-medium">Telefone</p>
                  <p className="text-sm text-muted-foreground">{ticket.telefone}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Detalhes da Entrega */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Detalhes da Entrega
            </h3>
            <div className="space-y-2 pl-6">
              <div>
                <p className="text-sm font-medium">Local de Retirada</p>
                <p className="text-sm text-muted-foreground uppercase">{(groupMeta?.retirada ?? ticket.retirada)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Folha de Pagamento</p>
                <p className="text-sm text-muted-foreground">
                  {(groupMeta?.folha ?? ticket.folha) ? 'Sim - Incluir folha de pagamento' : 'Não - Sem folha de pagamento'}
                </p>
              </div>
            </div>
          </div>

          {/* Processamento */}
          {ticket.usuario_compras && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Processamento
                </h3>
                <div className="space-y-2 pl-6">
                  <div>
                    <p className="text-sm font-medium">Processado por</p>
                    <p className="text-sm text-muted-foreground">{groupMeta?.usuario_compras ?? ticket.usuario_compras}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge className={`${statusInfo.color} text-white`}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {isPending ? (
            <>
              <Button 
                variant="outline" 
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reprovar
                  </>
                )}
              </Button>
              <Button 
                onClick={handleApprove}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprovar
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={onClose}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
