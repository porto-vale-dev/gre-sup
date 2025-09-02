
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useTickets } from '@/contexts/TicketContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Ticket, TicketStatus } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, Eye, FileText, Hourglass, CheckCircle2, AlertCircle, Ticket as TicketIcon, CalendarDays, Filter } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TicketDetailsModal } from './TicketDetailsModal';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'support' | 'billing';

const statusColors: Record<TicketStatus, string> = {
  "Novo": "bg-blue-500 hover:bg-blue-500",
  "Em Andamento": "bg-yellow-500 hover:bg-yellow-500",
  "Ativo": "bg-orange-500 hover:bg-orange-500",
  "Atrasado": "bg-red-500 hover:bg-red-500",
  "Concluído": "bg-green-500 hover:bg-green-500",
};

const statusIcons: Record<TicketStatus, React.ElementType> = {
  "Novo": FileText,
  "Em Andamento": Hourglass,
  "Ativo": Hourglass,
  "Atrasado": AlertCircle,
  "Concluído": CheckCircle2,
};

const StatCard = ({ title, value }: { title: string; value: number }) => (
    <Card className="text-center p-4">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
    </Card>
);

const UserTicketCard = ({ ticket, onOpenDetails }: { ticket: Ticket; onOpenDetails: (ticket: Ticket) => void }) => {
    const StatusIcon = statusIcons[ticket.status] || TicketIcon;
    const protocolDisplay = ticket.cobranca ? ticket.id.substring(0, 8) : String(ticket.protocol).padStart(4, '0');

    return (
        <Card className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex-grow space-y-2">
                <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">#{protocolDisplay}</p>
                    <Badge variant="outline" className={cn(ticket.cobranca ? "border-red-500 text-red-500" : "border-blue-500 text-blue-500")}>
                      {ticket.cobranca ? 'Cobrança' : 'Suporte GRE'}
                    </Badge>
                </div>
                <p className="font-semibold text-lg">{ticket.reason}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4"/> Enviado {formatDistanceToNow(parseISO(ticket.submission_date), { addSuffix: true, locale: ptBR })}</span>
                    <Badge variant={ticket.status === 'Concluído' ? 'default' : ticket.status === 'Atrasado' ? 'destructive' : 'secondary'} className={`${statusColors[ticket.status]} text-white`}>
                        {ticket.status}
                    </Badge>
                </div>
            </div>
            <div className="mt-4 md:mt-0 md:ml-4">
                 <Button variant="outline" size="icon" onClick={() => onOpenDetails(ticket)}>
                    <Eye className="h-5 w-5" />
                    <span className="sr-only">Ver detalhes</span>
                </Button>
            </div>
        </Card>
    );
};


export function MyTicketsClient() {
  const { tickets, isLoadingTickets, error } = useTickets();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const myTickets = useMemo(() => {
    if (!user) return [];
    return tickets.filter(ticket => ticket.user_id === user.id);
  }, [tickets, user]);

  const filteredTickets = useMemo(() => {
    let typeFiltered = myTickets;

    if (typeFilter === 'support') {
        typeFiltered = myTickets.filter(t => !t.cobranca);
    } else if (typeFilter === 'billing') {
        typeFiltered = myTickets.filter(t => t.cobranca);
    }

    const searchFiltered = typeFiltered.filter(ticket => 
        (ticket.cobranca 
          ? ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
          : String(ticket.protocol).toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        ticket.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return searchFiltered.sort((a, b) => parseISO(b.submission_date).getTime() - parseISO(a.submission_date).getTime());
  }, [myTickets, searchTerm, typeFilter]);

  const stats = useMemo(() => ({
    total: myTickets.length,
    pending: myTickets.filter(t => t.status !== 'Concluído').length,
    completed: myTickets.filter(t => t.status === 'Concluído').length
  }), [myTickets]);

  const handleOpenDetails = (ticket: Ticket) => {
    // For billing tickets, there's no detail modal for now.
    // For support tickets, open the modal.
    if (ticket.cobranca) {
      return; 
    }
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
  };

  if (isLoadingTickets) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="space-y-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </div>
        </div>
    );
  }

  if (error) {
    return <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao Carregar</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
    </Alert>
  }
  
  if (!user) {
    return <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Não Autenticado</AlertTitle>
        <AlertDescription>Você precisa estar logado para ver seus tickets.</AlertDescription>
    </Alert>
  }

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Total de Solicitações" value={stats.total} />
            <StatCard title="Solicitações Pendentes" value={stats.pending} />
            <StatCard title="Concluídas" value={stats.completed} />
        </div>
        
        <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className='flex-grow'>
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <TicketIcon className="w-24 h-24 text-primary/20 hidden md:block shrink-0" />
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl font-bold">Acompanhe o andamento das suas solicitações</h2>
                            <p className="text-muted-foreground mt-1">Veja abaixo suas solicitações e acompanhe a resposta do nosso time especializado.</p>
                        </div>
                    </div>
                </div>
                 <div className="border rounded-lg p-3 w-full md:w-auto">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2"><Filter className="h-4 w-4" /> Filtrar por tipo</p>
                    <div className="flex items-center gap-2">
                        <Button 
                            size="sm" 
                            variant={typeFilter === 'all' ? 'default' : 'outline'}
                            onClick={() => setTypeFilter('all')}
                        >
                            Todos
                        </Button>
                        <Button 
                            size="sm"
                            variant={typeFilter === 'support' ? 'default' : 'outline'}
                            className={cn(typeFilter === 'support' && "bg-blue-600 hover:bg-blue-700")}
                            onClick={() => setTypeFilter('support')}
                        >
                            Suporte GRE
                        </Button>
                         <Button 
                            size="sm"
                            variant={typeFilter === 'billing' ? 'default' : 'outline'}
                            className={cn(typeFilter === 'billing' && "bg-red-600 hover:bg-red-700")}
                            onClick={() => setTypeFilter('billing')}
                        >
                            Cobrança
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
        
        <div className="space-y-6">
            <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Pesquise pelo protocolo ou motivo da solicitação" 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-xl font-semibold">Confira aqui seus tickets</h3>
            </div>

            {filteredTickets.length > 0 ? (
                <div className="space-y-4">
                    {filteredTickets.map(ticket => (
                        <UserTicketCard key={ticket.id} ticket={ticket} onOpenDetails={handleOpenDetails} />
                    ))}
                </div>
            ) : (
                <Card className="flex flex-col items-center justify-center text-center p-12 space-y-4">
                    <FileText className="h-16 w-16 text-muted-foreground" />
                    <h3 className="text-xl font-semibold">Nenhum ticket encontrado</h3>
                    <p className="text-muted-foreground">Você não possui tickets que correspondam aos filtros selecionados. <br />Que tal abrir um novo?</p>
                    <Button asChild>
                        <Link href="/suporte-gre">Abrir Novo Ticket</Link>
                    </Button>
                </Card>
            )}
        </div>
        {selectedTicket && (
            <TicketDetailsModal 
                ticket={selectedTicket} 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
            />
        )}
    </div>
  );
}
