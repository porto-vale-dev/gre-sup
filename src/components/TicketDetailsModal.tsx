
"use client";

import type { Ticket } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
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
import { CalendarDays, Clock, User, Phone, MessageSquare, Paperclip, Tag, Info, Download, Eye } from 'lucide-react';
import { useTickets } from '@/contexts/TicketContext';
import { useToast } from '@/hooks/use-toast';

interface TicketDetailsModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TicketDetailsModal({ ticket, isOpen, onClose }: TicketDetailsModalProps) {
  const { downloadFile, getPublicUrl } = useTickets();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!ticket) return null;

  const handleDownload = async () => {
    if (ticket.file_path && ticket.file_name) {
      setIsDownloading(true);
      await downloadFile(ticket.file_path, ticket.file_name);
      setIsDownloading(false);
    }
  };

  const handlePreview = () => {
    if (ticket.file_path) {
      const url = getPublicUrl(ticket.file_path);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        toast({
          title: "Erro ao Visualizar",
          description: "Não foi possível gerar o link de visualização para o arquivo.",
          variant: "destructive",
        });
      }
    }
  };

  const isPreviewable = ticket.file_name && (
    /\.(pdf|jpg|jpeg|png|gif|txt)$/i.test(ticket.file_name)
  );


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
                <p>{format(parseISO(ticket.submission_date), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
              </div>
              <div>
                <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Clock className="h-4 w-4" />Previsão de Resposta:</strong>
                <p>{ticket.estimated_response_time}</p>
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

            {ticket.file_path && ticket.file_name && (
              <>
                <Separator />
                <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Paperclip className="h-4 w-4" />Arquivo Anexado:</strong>
                  <div className="flex items-center justify-between">
                    <p className="truncate mr-4" title={ticket.file_name}>{ticket.file_name}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isPreviewable && (
                        <Button variant="outline" size="sm" onClick={handlePreview} aria-label={`Visualizar ${ticket.file_name}`}>
                           <Eye className="mr-2 h-4 w-4" />
                           Visualizar
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading} aria-label={`Baixar ${ticket.file_name}`}>
                        <Download className="mr-2 h-4 w-4" />
                        {isDownloading ? 'Baixando...' : 'Baixar'}
                      </Button>
                    </div>
                  </div>
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
