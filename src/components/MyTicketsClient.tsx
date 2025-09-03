
"use client";

import { useState, useMemo } from 'react';
import { useTickets } from '@/contexts/TicketContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Ticket, TicketStatus } from '@/types';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, Eye, FileText, Hourglass, CheckCircle2, AlertCircle, Ticket as TicketIcon, CalendarDays, User } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TicketDetailsModal } from './TicketDetailsModal';
import Link from 'next/link';

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
    const protocolDisplay = String(ticket.protocol).padStart(4, '0');

    return (
        <Card className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex-grow space-y-2">
                <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">#{protocolDisplay}</p>
                </div>
                <p className="font-semibold text-lg">{ticket.reason}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4"/> Enviado {formatDistanceToNow(parseISO(ticket.submission_date), { addSuffix: true, locale: ptBR })}</span>
                    {ticket.responsible && (
                        <span className="flex items-center gap-1.5"><User className="h-4 w-4"/> Responsável: {ticket.responsible}</span>
                    )}
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
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const myTickets = useMemo(() => {
    if (!user) return [];
    // Filtra apenas tickets de suporte (aqueles criados pelo usuário logado)
    return tickets.filter(ticket => ticket.user_id === user.id);
  }, [tickets, user]);

  const filteredTickets = useMemo(() => {
    return myTickets.filter(ticket => 
        String(ticket.protocol).toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.reason.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => parseISO(b.submission_date).getTime() - parseISO(a.submission_date).getTime());
  }, [myTickets, searchTerm]);

  const stats = useMemo(() => ({
    total: myTickets.length,
    pending: myTickets.filter(t => t.status !== 'Concluído').length,
    completed: myTickets.filter(t => t.status === 'Concluído').length
  }), [myTickets]);

  const handleOpenDetails = (ticket: Ticket) => {
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
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <TicketIcon className="w-24 h-24 text-primary/20 hidden md:block shrink-0" />
                <div className="text-center md:text-left">
                    <h2 className="text-2xl font-bold">Acompanhe o andamento das suas solicitações</h2>
                    <p className="text-muted-foreground mt-1">Veja abaixo suas solicitações e acompanhe a resposta do nosso time especializado.</p>
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
                    <p className="text-muted-foreground">Você ainda não abriu nenhum ticket de suporte. <br />Que tal abrir um novo?</p>
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
                isReadOnlyView={true} 
            />
        )}
    </div>
  );
}
