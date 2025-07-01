
"use client";

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Ticket, TicketStatus } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TICKET_STATUSES } from '@/lib/constants';
import { useTickets } from '@/contexts/TicketContext';
import { CalendarDays, Clock, FileText, User, Tag, Edit3, Check, AlertTriangle, Hourglass, CheckCircle2, ExternalLink, X } from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket;
  onOpenDetails: (ticket: Ticket) => void;
}

const statusColors: Record<TicketStatus, string> = {
  "Novo": "bg-blue-500",
  "Em Andamento": "bg-yellow-500",
  "Atrasado": "bg-red-500",
  "Concluído": "bg-green-500",
};

const statusIcons: Record<TicketStatus, React.ElementType> = {
  "Novo": FileText,
  "Em Andamento": Hourglass,
  "Atrasado": AlertTriangle,
  "Concluído": CheckCircle2,
};

export function TicketCard({ ticket, onOpenDetails }: TicketCardProps) {
  const { updateTicketStatus, updateTicketResponsible } = useTickets();
  const [responsible, setResponsible] = useState(ticket.responsible || "");
  const [isEditingResponsible, setIsEditingResponsible] = useState(false);

  const handleStatusChange = async (status: string) => {
    await updateTicketStatus(ticket.id, status as TicketStatus);
  };

  const saveResponsible = async () => {
    if (responsible.trim() !== (ticket.responsible || "").trim()) {
      await updateTicketResponsible(ticket.id, responsible.trim());
    }
    setIsEditingResponsible(false);
  };

  const cancelEdit = () => {
    setResponsible(ticket.responsible || "");
    setIsEditingResponsible(false);
  };

  const StatusIcon = statusIcons[ticket.status];

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-headline text-primary flex items-center gap-2">
             <StatusIcon className="h-5 w-5"/> {ticket.reason.length > 30 ? `${ticket.reason.substring(0,27)}...` : ticket.reason}
          </CardTitle>
          <Badge variant={ticket.status === 'Concluído' ? 'default' : ticket.status === 'Atrasado' ? 'destructive' : 'secondary'} className={`whitespace-nowrap ${statusColors[ticket.status]} text-white`}>
            {ticket.status}
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
          <CalendarDays className="h-3.5 w-3.5" /> Recebido em: {format(parseISO(ticket.submission_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm flex-grow">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{ticket.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>Resposta: {ticket.estimated_response_time}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          {isEditingResponsible ? (
            <div className="flex items-center gap-1 w-full">
                <Input
                    autoFocus
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') saveResponsible();
                        if (e.key === 'Escape') cancelEdit();
                    }}
                    className="h-8 text-xs"
                    placeholder="Nome do responsável"
                />
                <Button size="icon" variant="ghost" onClick={saveResponsible} className="h-7 w-7 shrink-0" aria-label="Salvar responsável">
                    <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={cancelEdit} className="h-7 w-7 shrink-0" aria-label="Cancelar edição">
                    <X className="h-4 w-4" />
                </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1 w-full justify-between">
              <span className={ticket.responsible ? "" : "italic text-muted-foreground"}>
                {ticket.responsible || "Não atribuído"}
              </span>
              <Button size="icon" variant="ghost" onClick={() => setIsEditingResponsible(true)} className="h-7 w-7" aria-label="Editar responsável">
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
           <Select value={ticket.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-9 text-xs w-full" aria-label="Mudar status do ticket">
              <SelectValue placeholder="Mudar status" />
            </SelectTrigger>
            <SelectContent>
              {TICKET_STATUSES.map(s => (
                <SelectItem key={s} value={s} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full" onClick={() => onOpenDetails(ticket)}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Ver Detalhes
        </Button>
      </CardFooter>
    </Card>
  );
}
