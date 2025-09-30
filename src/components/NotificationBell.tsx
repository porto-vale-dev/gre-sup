
"use client";

import React, { useMemo, useContext } from 'react';
import { useRouter } from 'next/navigation';
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
import { format, parseISO, isValid } from 'date-fns';
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

const getTicketDate = (ticket: CombinedTicket): string | null => {
    switch(ticket.type) {
        case 'support':
            return ticket.submission_date;
        case 'cobranca':
            return ticket.created_at || ticket.data_atend;
        case 'pos-contemplacao':
            return ticket.created_at;
    }
}

export function NotificationBell() {
  const router = useRouter();
  const { user, username, email, cargo } = useAuth();
  const { tickets: supportTickets, markTicketAsViewed: markSupportTicketAsViewed } = useTickets();
  const { tickets: cobrancaTickets } = useCobrancaTickets();
  const { tickets: posContemplacaoTickets, markTicketAsViewed: markPosContemplacaoTicketAsViewed } = usePosContemplacaoTickets();
  const { openModal } = useContext(ModalContext);

  const allNotifications = useMemo(() => {
    if (!user || !email) return [];
    
    const combinedList: CombinedTicket[] = [];

    // Regra 1: Notificações de Suporte GRE
    supportTickets
      .filter(t => 
        // Para o responsável, se o status for "Novo"
        (t.responsible === username && t.status === 'Novo') ||
        // Para o criador, se o status for "Concluído" e não visualizado
        (t.user_id === user.id && t.status === 'Concluído' && (t.visualizado === false || t.visualizado === null))
      )
      .forEach(t => combinedList.push({ ...t, type: 'support' }));

    // Regra 2: Notificações de Apoio Jacareí (Cobrança)
    cobrancaTickets
      .filter(t => 
        // Para o criador, se o status for "Respondida"
        (t.user_id === user.id && t.status === 'Respondida') ||
        // Para gerente/diretor, se o status for "Reabertura" OU "Aberta"
        ((t.email_gerente === email || t.email_diretor === email) && (t.status === 'Reabertura' || t.status === 'Aberta'))
      )
      .forEach(t => combinedList.push({ ...t, type: 'cobranca' }));

    // Regra 3: Notificações de Pós-Contemplação
    posContemplacaoTickets
      .filter(t => 
          (t.responsavel === email && (t.status === 'Aberto' || t.status === 'Urgente')) ||
          (t.relator === email && t.status === 'Retorno') ||
          (t.relator === email && t.status === 'Concluído' && (t.visualizado === false || t.visualizado === null))
      )
      .forEach(t => combinedList.push({ ...t, type: 'pos-contemplacao' }));
      
    // Sort by date, most recent first
    combinedList.sort((a, b) => {
        const dateAString = getTicketDate(a);
        const dateBString = getTicketDate(b);

        if (!dateAString || !isValid(parseISO(dateAString))) return 1;
        if (!dateBString || !isValid(parseISO(dateBString))) return -1;
        
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
    const managerRoles = ['gerente', 'gerente1', 'diretor'];
    const isManager = cargo && managerRoles.includes(cargo);

    if (isManager && ticket.type === 'cobranca') {
      router.push('/suporte-gre/minhas-solicitacoes');
      return; 
    }
    
    if (ticket.type === 'pos-contemplacao' && ticket.status === 'Concluído') {
        router.push('/pos-contemplacao/archived');
        return;
    }

    if (isManager && ticket.type === 'support' && ticket.status === 'Concluído') {
      router.push('/suporte-gre/minhas-solicitacoes');
      return;
    }

    const { type, ...ticketData } = ticket;
    openModal(ticketData as any);
  };

  const dismissNotification = async (ticket: CombinedTicket, event: React.MouseEvent) => {
    event.stopPropagation();
    if(ticket.type === 'support') {
      await markSupportTicketAsViewed(ticket.id);
    } else if (ticket.type === 'pos-contemplacao') {
      await markPosContemplacaoTicketAsViewed(ticket.id);
    }
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
                        const protocol = ticket.type === 'support' ? ticket.protocol : ticket.protocolo;
                        const motivo = 'reason' in ticket ? ticket.reason : ticket.motivo;
                        const dateString = getTicketDate(ticket);
                        const formattedDate = dateString && isValid(parseISO(dateString)) ? format(parseISO(dateString), "dd/MM/yy 'às' HH:mm", { locale: ptBR }) : '';
                        const status = ticket.status as TicketStatus | CobrancaTicketStatus | PosContemplacaoTicketStatus;
                        
                        const isDismissable = 
                          (ticket.type === 'support' && ticket.status === 'Concluído') || 
                          (ticket.type === 'pos-contemplacao' && ticket.status === 'Concluído');

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
                                        onClick={(e) => dismissNotification(ticket, e)}
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
