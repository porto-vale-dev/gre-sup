
"use client";

import type { CobrancaTicket, RetornoComercialStatus } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState, useEffect } from 'react';
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, User, Phone, MessageSquare, Tag, Edit, Ticket as TicketIcon, Users, Fingerprint, UserSquare, Mail, Save, BarChartHorizontal } from 'lucide-react';
import { useCobrancaTickets } from '@/contexts/CobrancaTicketContext';
import { RETORNO_COMERCIAL_STATUSES } from '@/lib/cobrancaData';


interface CobrancaTicketDetailsModalProps {
  ticket: CobrancaTicket | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CobrancaTicketDetailsModal({ ticket: initialTicket, isOpen, onClose }: CobrancaTicketDetailsModalProps) {
  const { getTicketById, updateRetornoComercial } = useCobrancaTickets();
  
  const ticket = initialTicket ? getTicketById(initialTicket.id) || initialTicket : null;

  const [retornoStatus, setRetornoStatus] = useState<RetornoComercialStatus | undefined>(ticket?.status_retorno || undefined);
  const [retornoObs, setRetornoObs] = useState(ticket?.obs_retorno || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (ticket) {
      setRetornoStatus(ticket.status_retorno || undefined);
      setRetornoObs(ticket.obs_retorno || "");
    }
  }, [ticket?.id, isOpen]); 

  if (!ticket) return null;

  const protocolDisplay = ticket.id.substring(0, 8); 

  const handleSave = async () => {
    if (!retornoStatus) {
        // You might want to add a toast here to inform the user
        return;
    }
    setIsSaving(true);
    const success = await updateRetornoComercial(ticket.id, retornoStatus, retornoObs);
    if(success) {
      onClose();
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="font-headline text-2xl text-primary flex items-center">
            <TicketIcon className="mr-2 h-6 w-6" />Protocolo de Apoio #{protocolDisplay}
          </DialogTitle>
          <DialogDescription>
            Visualização completa e gestão do ticket de apoio ao comercial.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto">
          <div className="px-6 py-4 space-y-6">
            {/* Ticket Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><UserSquare className="h-4 w-4" />Nome do Cliente:</strong>
                  <p>{ticket.nome_cliente}</p>
                </div>
                 <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Fingerprint className="h-4 w-4" />CPF ou CNPJ do Cliente:</strong>
                  <p>{ticket.cpf}</p>
                </div>
                 <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Tag className="h-4 w-4" />Cota:</strong>
                  <p>{ticket.cota}</p>
                </div>
                <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><BarChartHorizontal className="h-4 w-4" />Produção:</strong>
                  <p>{ticket.producao}</p>
                </div>
                <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Phone className="h-4 w-4" />Telefone:</strong>
                  <p>{ticket.telefone}</p>
                </div>
                 {ticket.email && (
                  <div>
                    <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Mail className="h-4 w-4" />E-mail do Cliente:</strong>
                    <p>{ticket.email}</p>
                  </div>
                )}
                 <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><User className="h-4 w-4" />Diretor:</strong>
                  <p>{ticket.diretor}</p>
                </div>
                 <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Users className="h-4 w-4" />Gerente:</strong>
                  <p>{ticket.gerente}</p>
                </div>
                <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Data de Abertura:</strong>
                  <p>{format(parseISO(ticket.data_atend), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
                </div>
                <div>
                  <strong className="font-medium text-muted-foreground">Status:</strong>
                  <Badge variant={ticket.status === 'Resolvida' ? 'default' : ticket.status === 'Fora do prazo' ? 'destructive' : 'secondary'}>{ticket.status}</Badge>
                </div>
              </div>
              <Separator />
              <div>
                <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><MessageSquare className="h-4 w-4" />Motivo da Solicitação:</strong>
                <p>{ticket.motivo}</p>
              </div>
              {ticket.observacoes && (
                <>
                  <Separator />
                  <div>
                    <strong className="font-medium text-muted-foreground">Observações da Solicitação:</strong>
                    <p className="whitespace-pre-wrap break-words bg-muted/50 p-3 rounded-md max-h-40 overflow-y-auto">{ticket.observacoes}</p>
                  </div>
                </>
              )}
            </div>

            <Separator className="my-6" />

            {/* Retorno do Comercial Section */}
            <div className="space-y-4">
               <h3 className="font-headline text-lg text-primary flex items-center gap-2">
                <Edit className="h-5 w-5" /> Retorno do Comercial
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <Label htmlFor="retorno-status">Status do Retorno</Label>
                    <Select value={retornoStatus} onValueChange={(val) => setRetornoStatus(val as RetornoComercialStatus)}>
                        <SelectTrigger id="retorno-status">
                            <SelectValue placeholder="Selecione o status do retorno" />
                        </SelectTrigger>
                        <SelectContent>
                            {RETORNO_COMERCIAL_STATUSES.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
              </div>
               <div>
                <Label htmlFor="retorno-obs">Observações do Retorno</Label>
                <Textarea
                  id="retorno-obs"
                  placeholder="Descreva as ações tomadas, o que foi conversado com o cliente, etc..."
                  className="min-h-[120px] resize-y mt-1"
                  value={retornoObs}
                  onChange={(e) => setRetornoObs(e.target.value)}
                  disabled={isSaving}
                />
              </div>

            </div>
          </div>
        </div>
        
        <DialogFooter className="px-6 pb-6 pt-4 border-t flex-wrap sm:flex-nowrap justify-between items-center gap-2 shrink-0">
            <div className="flex-grow hidden sm:block" />
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={onClose} className="w-full">Fechar</Button>
              <Button onClick={handleSave} disabled={isSaving || !retornoStatus} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Salvando...' : 'Salvar Retorno'}
              </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
