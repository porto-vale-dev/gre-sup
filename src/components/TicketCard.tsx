"use client";

import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Ticket, TicketStatus } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TICKET_STATUSES } from '@/lib/constants';
import { useTickets } from '@/contexts/TicketContext';
import { CalendarDays, Clock, FileText, User, Tag, Edit3, Check, AlertTriangle, Hourglass, CheckCircle2, ExternalLink } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';

interface TicketCardProps {
  ticket: Ticket;
  onOpenDetails: (ticket: Ticket) => void;
  responsibleSuggestions: string[];
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

export function TicketCard({ ticket, onOpenDetails, responsibleSuggestions = [] }: TicketCardProps) {
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
  
  const handleSelectResponsible = async (value: string) => {
    setResponsible(value);
    await updateTicketResponsible(ticket.id, value);
    setIsEditingResponsible(false);
  }

  const StatusIcon = statusIcons[ticket.status];
  const filteredSuggestions = responsibleSuggestions.filter(s => s.toLowerCase().includes(responsible.toLowerCase()) && s.toLowerCase() !== responsible.toLowerCase());

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
             <div className="relative w-full">
              <Command>
                 <CommandInput
                    placeholder="Nome do responsável"
                    value={responsible}
                    onValueChange={setResponsible}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent form submission
                        saveResponsible();
                      }
                    }}
                    onBlur={saveResponsible}
                    className="h-8 text-xs"
                  />
                  {filteredSuggestions.length > 0 && (
                    <CommandList className="absolute top-9 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                      <CommandEmpty>Nenhum responsável encontrado.</CommandEmpty>
                      <CommandGroup heading="Sugestões">
                        {filteredSuggestions.map((suggestion) => (
                          <CommandItem
                            key={suggestion}
                            onSelect={() => handleSelectResponsible(suggestion)}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            {suggestion}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  )}
              </Command>
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
