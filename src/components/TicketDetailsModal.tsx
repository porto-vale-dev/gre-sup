
"use client";

import type { Ticket } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, Clock, User, Phone, MessageSquare, Paperclip, Tag, Info, Download } from 'lucide-react';

interface TicketDetailsModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TicketDetailsModal({ ticket, isOpen, onClose }: TicketDetailsModalProps) {
  if (!ticket) return null;

  const handleDownload = () => {
    if (ticket.file && ticket.file.content) {
      const link = document.createElement('a');
      link.href = ticket.file.content;
      link.download = ticket.file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary flex items-center">
            <Info className="mr-2 h-6 w-6" />Detalhes do Ticket #{ticket.id.substring(0, 8)}
          </DialogTitle>
          <DialogDescription>
            Visualização completa das informações do ticket.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><User className="h-4 w-4" />Nome:</strong>
                <p>{ticket.name}</p>
              </div>
              <div>
                <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Phone className="h-4 w-4" />Telefone:</strong>
                <p>{ticket.phone}</p>
              </div>
              <div>
                <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Data de Abertura:</strong>
                <p>{format(parseISO(ticket.submissionDate), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
              </div>
              <div>
                <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Clock className="h-4 w-4" />Previsão de Resposta:</strong>
                <p>{ticket.estimatedResponseTime}</p>
              </div>
               <div>
                <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Tag className="h-4 w-4" />Responsável:</strong>
                <p>{ticket.responsible || "Não atribuído"}</p>
              </div>
               <div>
                <strong className="font-medium text-muted-foreground">Status:</strong>
                <Badge variant={ticket.status === 'Concluído' ? 'default' : ticket.status === 'Atrasado' ? 'destructive' : 'secondary'}>{ticket.status}</Badge>
              </div>
            </div>

            <Separator />

            <div>
              <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><MessageSquare className="h-4 w-4" />Motivo do Ticket:</strong>
              <p>{ticket.reason}</p>
            </div>

            {ticket.observations && (
              <>
                <Separator />
                <div>
                  <strong className="font-medium text-muted-foreground">Observações:</strong>
                  <p className="whitespace-pre-wrap break-words bg-muted/50 p-3 rounded-md max-h-60 overflow-y-auto">{ticket.observations}</p>
                </div>
              </>
            )}

            {ticket.file && (
              <>
                <Separator />
                <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Paperclip className="h-4 w-4" />Arquivo Anexado:</strong>
                  <div className="flex items-center justify-between">
                    <p>
                      {ticket.file.name} ({ (ticket.file.size / 1024).toFixed(2) } KB)
                    </p>
                    {ticket.file.content && (
                      <Button variant="outline" size="sm" onClick={handleDownload} aria-label={`Baixar ${ticket.file.name}`}>
                        <Download className="mr-2 h-4 w-4" />
                        Baixar
                      </Button>
                    )}
                  </div>
                   {!ticket.file.content && <p className="text-xs text-muted-foreground">Pré-visualização/download não disponível para este arquivo.</p>}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
