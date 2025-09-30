

"use client";

import React, { useMemo, useContext, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Ticket, Briefcase, FileCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTickets } from '@/contexts/TicketContext';
import { useCobrancaTickets } from '@/contexts/CobrancaTicketContext';
import { usePosContemplacaoTickets } from '@/contexts/PosContemplacaoTicketContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from './ui/scroll-area';
import { ModalContext } from './AppProviders';
import type { Ticket as SupportTicket, CobrancaTicket, PosContemplacaoTicket, TicketStatus, CobrancaTicketStatus, PosContemplacaoTicketStatus } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from './ui/badge';

type CombinedTicket = 
    | ({ type: 'support' } & SupportTicket)
    | ({ type: 'cobranca' } & CobrancaTicket)
    | ({ type: 'pos-contemplacao' } & PosContemplacaoTicket);

const statusColors: Record<TicketStatus | CobrancaTicketStatus | PosContemplacaoTicketStatus, string> = {
  // Suporte
  "Novo": "bg-blue-500",
  "Em Andamento": "bg-yellow-500",
  "Ativo": "bg-orange-500",
  "Atrasado": "bg-red-500",
  "Porto Resolve": "bg-purple-600",
  "Suporte": "bg-gray-500",
  "Concluído": "bg-green-500",
  // Cobrança
  "Aberta": "bg-blue-500",
  "Em análise": "bg-yellow-500",
  "Respondida": "bg-purple-600",
  "Encaminhada": "bg-orange-500",
  "Reabertura": "bg-pink-500",
  "Resolvida": "bg-green-500",
  "Dentro do prazo": "bg-teal-500",
  "Fora do prazo": "bg-red-500",
  // Pós-Contemplação
  "Aberto": "bg-blue-500",
  "Em Análise": "bg-yellow-500",
  "Urgente": "bg-red-500",
  "Retorno": "bg-pink-500",
};

const panelInfo = {
    support: { icon: Ticket, label: 'Suporte GRE', color: 'text-blue-500' },
    cobranca: { icon: Briefcase, label: 'Apoio Jacareí', color: 'text-red-500' },
    'pos-contemplacao': { icon: FileCheck, label: 'Pós-Contemplação', color: 'text-green-500' }
};


export function NotificationBell() {
  const { user, username, email, cargo } = useAuth();
  const { tickets: supportTickets, markTicketAsViewed } = useTickets();
  const { tickets: cobrancaTickets } = useCobrancaTickets();
  const { tickets: posContemplacaoTickets } = usePosContemplacaoTickets();
  const { openModal } = useContext(ModalContext);

  const allNotifications = useMemo(() => {
    if (!user || !email) return [];
    
    const combinedList: CombinedTicket[] = [];

    // Regra 1: Notificações de Suporte GRE
    // Para o responsável, se o status for "Novo"
    supportTickets
      .filter(t => t.responsible === username && t.status === 'Novo')
      .forEach(t => combinedList.push({ ...t, type: 'support' }));
    
    // Para o criador do ticket, se o status for "Concluído" E `visualizado` for false ou nulo
    supportTickets
      .filter(t => t.user_id === user.id && t.status === 'Concluído' && (t.visualizado === false || t.visualizado === null))
      .forEach(t => combinedList.push({ ...t, type: 'support' }));

    // Regra 2: Notificações de Apoio Jacareí
    // Para o criador do ticket, se o status for "Respondida"
    cobrancaTickets
      .filter(t => t.user_id === user.id && t.status === 'Respondida')
      .forEach(t => combinedList.push({ ...t, type: 'cobranca' }));

    // Para gerente/diretor, se o status for "Aberta" ou "Reabertura"
    cobrancaTickets
        .filter(t => 
            (t.email_gerente === email || t.email_diretor === email) &&
            (t.status === 'Aberta' || t.status === 'Reabertura')
        )
        .forEach(t => combinedList.push({ ...t, type: 'cobranca' }));


    // Regra 3: Notificações de Pós-Contemplação
    // Para responsável, se status for "Aberto" ou "Urgente"
    // Para relator, se status for "Retorno"
    posContemplacaoTickets
      .filter(t => 
          (t.responsavel === email && (t.status === 'Aberto' || t.status === 'Urgente')) ||
          (t.relator === email && t.status === 'Retorno')
      )
      .forEach(t => combinedList.push({ ...t, type: 'pos-contemplacao' }));
      
    // Sort by date, most recent first
    combinedList.sort((a, b) => {
        const dateAString = 'created_at' in a ? (a.created_at || ('submission_date' in a ? a.submission_date : '')) : ('submission_date' in a ? a.submission_date : '');
        const dateBString = 'created_at' in b ? (b.created_at || ('submission_date' in b ? b.submission_date : '')) : ('submission_date' in b ? b.submission_date : '');

        if (!dateAString) return 1;
        if (!dateBString) return -1;
        
        const dateA = new Date(dateAString).getTime();
        const dateB = new Date(dateBString).getTime();
        
        return dateB - dateA;
    });

    // Remove duplicates by ID, keeping the first occurrence (which is the most relevant due to sorting/filtering)
    const uniqueNotifications = Array.from(new Map(combinedList.map(item => [item.id, item])).values());
    
    return uniqueNotifications;
  }, [user, username, email, supportTickets, cobrancaTickets, posContemplacaoTickets]);

  const notificationCount = allNotifications.length;
  
  const handleTicketClick = (ticket: CombinedTicket) => {
      const { type, ...ticketData } = ticket;
      openModal(ticketData as any);
  };

  const dismissNotification = async (ticketId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await markTicketAsViewed(ticketId);
  }
  
  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label={`Notificações (${notificationCount})`}>
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {notificationCount}
                </div>
              )}
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
             {notificationCount === 0 ? (
                <p className="px-2 py-4 text-sm text-center text-muted-foreground">Nenhuma notificação nova.</p>
             ) : (
                <ScrollArea className="h-[400px]">
                    {allNotifications.map((ticket) => {
                        const protocol = 'protocolo' in ticket ? ticket.protocolo : ticket.protocol;
                        const motivo = 'motivo' in ticket ? ticket.motivo : ticket.reason;
                        const dateString = 'created_at' in ticket ? (ticket.created_at || ('submission_date' in ticket ? ticket.submission_date : '')) : ticket.submission_date;
                        const formattedDate = dateString ? format(parseISO(dateString), "dd/MM/yy 'às' HH:mm", { locale: ptBR }) : '';
                        const status = ticket.status as TicketStatus | CobrancaTicketStatus | PosContemplacaoTicketStatus;
                        
                        const isDismissable = ticket.type === 'support' && ticket.status === 'Concluído';

                        const PanelIcon = panelInfo[ticket.type].icon;

                        return (
                            <DropdownMenuItem key={ticket.id} onSelect={() => handleTicketClick(ticket)} className="cursor-pointer flex justify-between items-start">
                                <div className="flex items-start gap-3 py-2 flex-grow">
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="flex items-center gap-2">
                                            <PanelIcon className={`h-4 w-4 shrink-0 ${panelInfo[ticket.type].color}`} />
                                            <span className={`text-xs font-semibold ${panelInfo[ticket.type].color}`}>{panelInfo[ticket.type].label}</span>
                                        </div>
                                        <p className="text-sm font-medium leading-tight">{motivo}</p>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                          <span>#{String(protocol).padStart(4, '0')}</span>
                                          {formattedDate && <span className="text-xs text-muted-foreground">{formattedDate}</span>}
                                          <Badge variant="secondary" className={`w-fit text-white ${statusColors[status]}`}>{status}</Badge>
                                        </div>
                                    </div>
                                </div>
                                {isDismissable && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 shrink-0"
                                        onClick={(e) => dismissNotification(ticket.id, e)}
                                        aria-label="Dispensar notificação"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </DropdownMenuItem>
                        )
                    })}
                </ScrollArea>
             )}
        </DropdownMenuContent>
    </DropdownMenu>
  );
}

