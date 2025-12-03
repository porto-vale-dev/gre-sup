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
  Truck,
  Loader2
} from 'lucide-react';
import { useComprasTickets } from '@/contexts/ComprasTicketContext';
import { useToast } from '@/hooks/use-toast';

interface EntregaComprasModalProps {
  ticket: ComprasTicket;
  onClose: () => void;
  currentUser: string;
  groupItems?: Array<{ id: number; produto: string; quantidade: number; tamanho?: string | null; total: string }>;
  groupMeta?: { createdAtDisplay: string; email: string; retirada: string; folha: boolean; aprovado: boolean | null; usuario_compras?: string | null };
}

export function EntregaComprasModal({ ticket, onClose, currentUser, groupItems, groupMeta }: EntregaComprasModalProps) {
  const { markAsDelivered } = useComprasTickets();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const displayDate = groupMeta?.createdAtDisplay ?? (ticket.created_at 
    ? format(parseISO(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) 
    : 'N/A');
  const isGroup = Boolean(groupItems && groupItems.length > 0);
  const groupTotal = isGroup ? groupItems!.reduce((sum, it) => sum + parseFloat(it.total || '0'), 0) : 0;

  const handleMarkDelivered = async () => {
    const confirmed = window.confirm(isGroup 
      ? `Confirmar a entrega de TODOS os ${groupItems!.length} itens deste pedido?` 
      : 'Confirmar a entrega deste pedido?');
    
    if (!confirmed) return;

    setIsProcessing(true);
    if (isGroup) {
      const ids = groupItems!.map(i => i.id);
      const results = await Promise.all(ids.map(id => markAsDelivered(id, currentUser)));
      const success = results.every(Boolean);
      if (success) {
        toast({ title: 'Entrega registrada', description: `${ids.length} itens marcados como entregues.` });
        onClose();
      } else {
        toast({ title: 'Falha ao registrar entrega', variant: 'destructive', description: 'Alguns itens não foram atualizados.' });
      }
    } else {
      const success = await markAsDelivered(ticket.id, currentUser);
      if (success) {
        onClose();
      }
    }
    setIsProcessing(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Pedido #{(groupItems?.[0]?.id ?? ticket.id)}
            </DialogTitle>
            <Badge className="bg-blue-500 text-white">
              Aguardando Entrega
            </Badge>
          </div>
          <DialogDescription>
            Confirme a entrega do pedido
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

          {/* Aprovação */}
          {(groupMeta?.usuario_compras || ticket.usuario_compras) && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Aprovação
                </h3>
                <div className="space-y-2 pl-6">
                  <div>
                    <p className="text-sm font-medium">Aprovado por</p>
                    <p className="text-sm text-muted-foreground">{groupMeta?.usuario_compras ?? ticket.usuario_compras}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleMarkDelivered}
            disabled={isProcessing}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Truck className="mr-2 h-4 w-4" />
                Confirmar Entrega
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
