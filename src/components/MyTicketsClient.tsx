
"use client";

import { useState, useMemo } from 'react';
import { useTickets } from '@/contexts/TicketContext';
import { useCobrancaTickets } from '@/contexts/CobrancaTicketContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Ticket, TicketStatus, CobrancaTicket } from '@/types';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, Eye, FileText, Hourglass, CheckCircle2, AlertCircle, Ticket as TicketIcon, CalendarDays, User, Filter, Briefcase } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TicketDetailsModal } from './TicketDetailsModal';
import { CobrancaTicketDetailsModal } from './CobrancaTicketDetailsModal';
import Link from 'next/link';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from '@/lib/utils';


const statusColors: Record<TicketStatus, string> = {
  "Novo": "bg-blue-500 hover:bg-blue-500",
  "Em Andamento": "bg-yellow-500 hover:bg-yellow-500",
  "Ativo": "bg-orange-500 hover:bg-orange-500",
  "Atrasado": "bg-red-500 hover:bg-red-500",
  "Concluído": "bg-green-500 hover:bg-green-500",
  // Cobrança statuses need to be handled, we can map them
  "Aberta": "bg-blue-500 hover:bg-blue-500",
  "Em análise": "bg-yellow-500 hover:bg-yellow-500",
  "Encaminhada": "bg-orange-500 hover:bg-orange-500",
  "Resolvida": "bg-green-500 hover:bg-green-500",
  "Dentro do prazo": "bg-teal-500 hover:bg-teal-500",
  "Fora do prazo": "bg-red-500 hover:bg-red-500",
};

const statusIcons: Record<TicketStatus, React.ElementType> = {
  "Novo": FileText,
  "Em Andamento": Hourglass,
  "Ativo": Hourglass,
  "Atrasado": AlertCircle,
  "Concluído": CheckCircle2,
  // Cobrança
  "Aberta": FileText,
  "Em análise": Hourglass,
  "Encaminhada": Hourglass,
  "Resolvida": CheckCircle2,
  "Dentro do prazo": CheckCircle2,
  "Fora do prazo": AlertCircle,
};

const StatCard = ({ title, value }: { title: string; value: number }) => (
    <Card className="text-center p-4">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
    </Card>
);

const isCobrancaTicket = (ticket: Ticket | CobrancaTicket): ticket is CobrancaTicket => {
    return 'diretor' in ticket;
};

const UserTicketCard = ({ ticket, onOpenDetails }: { ticket: Ticket | CobrancaTicket; onOpenDetails: (ticket: Ticket | CobrancaTicket) => void }) => {
    const StatusIcon = statusIcons[ticket.status as TicketStatus] || TicketIcon;
    const isCobrança = isCobrancaTicket(ticket);
    const submissionDate = isCobrança ? ticket.data_atend : ticket.submission_date;
    const reason = isCobrança ? ticket.motivo : ticket.reason;
    const protocolDisplay = isCobrança ? ticket.id.substring(0,8) : String(ticket.protocol).padStart(4, '0');
    const responsible = isCobrança ? 'Comercial' : ticket.responsible;

    return (
        <Card className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex-grow space-y-2">
                <div className="flex items-center gap-2">
                     <p className="text-sm text-muted-foreground">#{protocolDisplay}</p>
                    {isCobrança && (
                        <Badge variant="outline" className="border-red-500/50 text-red-600 flex items-center gap-1">
                            <Briefcase className="h-3 w-3"/>
                            Cobrança
                        </Badge>
                    )}
                </div>
                <p className="font-semibold text-lg">{reason}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4"/> Enviado {formatDistanceToNow(parseISO(submissionDate), { addSuffix: true, locale: ptBR })}</span>
                    {responsible && (
                        <span className="flex items-center gap-1.5"><User className="h-4 w-4"/> Responsável: {responsible}</span>
                    )}
                    <Badge variant={ticket.status === 'Concluído' || ticket.status === 'Resolvida' ? 'default' : ticket.status === 'Atrasado' ? 'destructive' : 'secondary'} className={`${statusColors[ticket.status as TicketStatus]} text-white`}>
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
  const { tickets: supportTickets, isLoadingTickets: isLoadingSupport, error: supportError } = useTickets();
  const { tickets: cobrancaTickets, isLoading: isLoadingCobranca, error: cobrancaError } = useCobrancaTickets();
  const { user } = useAuth();
  
  type FilterType = 'Todos' | 'Suporte' | 'Cobrança';
  const [filterType, setFilterType] = useState<FilterType>('Todos');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | CobrancaTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const myTickets = useMemo(() => {
    if (!user) return [];
    
    const allTickets: (Ticket | CobrancaTicket)[] = [
      ...supportTickets.filter(t => t.user_id === user.id),
      ...cobrancaTickets
    ];
    
    return allTickets;
  }, [supportTickets, cobrancaTickets, user]);

  const filteredTickets = useMemo(() => {
    return myTickets.filter(ticket => {
        const typeMatch = 
            filterType === 'Todos' ||
            (filterType === 'Suporte' && !isCobrancaTicket(ticket)) ||
            (filterType === 'Cobrança' && isCobrancaTicket(ticket));

        const isCobrança = isCobrancaTicket(ticket);
        const protocolMatch = isCobrança 
            ? ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
            : String(ticket.protocol).toLowerCase().includes(searchTerm.toLowerCase());
        const reason = isCobrança ? ticket.motivo : ticket.reason;

        const searchMatch = protocolMatch || reason.toLowerCase().includes(searchTerm.toLowerCase());

        return typeMatch && searchMatch;
    }).sort((a, b) => {
        const dateA = isCobrancaTicket(a) ? a.data_atend : a.submission_date;
        const dateB = isCobrancaTicket(b) ? b.data_atend : b.submission_date;
        return parseISO(dateB).getTime() - parseISO(dateA).getTime()
    });
  }, [myTickets, searchTerm, filterType]);

  const stats = useMemo(() => {
    const relevantTickets = myTickets; // Base stats on all user-related tickets
    return {
        total: relevantTickets.length,
        pending: relevantTickets.filter(t => t.status !== 'Concluído' && t.status !== 'Resolvida').length,
        completed: relevantTickets.filter(t => t.status === 'Concluído' || t.status === 'Resolvida').length
    };
  }, [myTickets]);

  const handleOpenDetails = (ticket: Ticket | CobrancaTicket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
  };

  const isLoading = isLoadingSupport || isLoadingCobranca;
  const error = supportError || cobrancaError;

  if (isLoading) {
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
             <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="flex items-center gap-6">
                    <TicketIcon className="w-24 h-24 text-primary/20 hidden md:block shrink-0" />
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl font-bold">Acompanhe o andamento das suas solicitações</h2>
                        <p className="text-muted-foreground mt-1">Veja abaixo suas solicitações e acompanhe a resposta do nosso time especializado.</p>
                    </div>
                </div>

                <div className="border rounded-lg p-3 w-full md:w-auto shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Filtrar por tipo</span>
                    </div>
                     <ToggleGroup variant="outline" type="single" value={filterType} onValueChange={(value: FilterType) => {if(value) setFilterType(value)}} className="justify-start">
                        <ToggleGroupItem value="Todos" aria-label="Ver todos">Todos</ToggleGroupItem>
                        <ToggleGroupItem
                          value="Suporte"
                          aria-label="Ver Suporte GRE"
                          className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
                        >
                          Suporte GRE
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="Cobrança"
                          aria-label="Ver Cobrança"
                          className="data-[state=on]:bg-red-500 data-[state=on]:text-white"
                        >
                          Cobrança
                        </ToggleGroupItem>
                    </ToggleGroup>
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
                    <p className="text-muted-foreground">Você ainda não abriu ou não possui tickets que correspondam ao filtro selecionado.</p>
                    <Button asChild>
                        <Link href="/suporte-gre">Abrir Novo Ticket de Suporte</Link>
                    </Button>
                </Card>
            )}
        </div>
        {selectedTicket && !isCobrancaTicket(selectedTicket) && (
            <TicketDetailsModal 
                ticket={selectedTicket as Ticket} 
                isOpen={isModalOpen} 
                onClose={handleCloseModal}
                isReadOnlyView={true} 
            />
        )}
        {selectedTicket && isCobrancaTicket(selectedTicket) && (
             <CobrancaTicketDetailsModal
                ticket={selectedTicket as CobrancaTicket}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        )}
    </div>
  );
}
