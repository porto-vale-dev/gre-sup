"use client";

import { useState, useMemo } from 'react';
import { useTickets } from '@/contexts/TicketContext';
import { useCobrancaTickets } from '@/contexts/CobrancaTicketContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Ticket, TicketStatus, CobrancaTicket, CobrancaTicketStatus } from '@/types';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, Eye, FileText, Hourglass, CheckCircle2, AlertCircle, Ticket as TicketIcon, CalendarDays, User, Filter, Briefcase, Headset, ListFilter, ShieldCheck, Activity } from 'lucide-react';
import { formatDistanceToNow, parseISO, addDays, getDay, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TicketDetailsModal } from './TicketDetailsModal';
import { CobrancaTicketDetailsModal } from './CobrancaTicketDetailsModal';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const statusColors: Record<TicketStatus | CobrancaTicketStatus, string> = {
  // Suporte
  "Novo": "bg-blue-500 hover:bg-blue-500",
  "Em Andamento": "bg-yellow-500 hover:bg-yellow-500",
  "Ativo": "bg-orange-500 hover:bg-orange-500",
  "Atrasado": "bg-red-500 hover:bg-red-500",
  "Porto Resolve": "bg-purple-600 hover:bg-purple-600",
  "Suporte": "bg-gray-500 hover:bg-gray-500",
  "Concluído": "bg-green-500 hover:bg-green-500",
  "Tratado": "bg-cyan-500 hover:bg-cyan-500",
  // Cobrança
  "Aberta": "bg-blue-500 hover:bg-blue-500",
  "Em análise": "bg-yellow-500 hover:bg-yellow-500",
  "Respondida": "bg-purple-600 hover:bg-purple-600",
  "Encaminhada": "bg-orange-500 hover:bg-orange-500",
  "Reabertura": "bg-pink-500 hover:bg-pink-500",
  "Resolvida": "bg-green-500 hover:bg-green-500",
  "Dentro do prazo": "bg-teal-500 hover:bg-teal-500",
  "Fora do prazo": "bg-red-500 hover:bg-red-500",
};

const statusIcons: Record<TicketStatus | CobrancaTicketStatus, React.ElementType> = {
  // Suporte
  "Novo": FileText,
  "Em Andamento": Hourglass,
  "Ativo": Activity,
  "Atrasado": AlertCircle,
  "Porto Resolve": ShieldCheck,
  "Suporte": Headset,
  "Concluído": CheckCircle2,
  "Tratado": CheckCircle2,
  // Cobrança
  "Aberta": FileText,
  "Em análise": Hourglass,
  "Respondida": Hourglass,
  "Encaminhada": Hourglass,
  "Reabertura": FileText,
  "Resolvida": CheckCircle2,
  "Dentro do prazo": CheckCircle2,
  "Fora do prazo": AlertCircle,
};

const getBusinessHours = (startDate: Date): number => {
    let currentDate = new Date();
    let businessHours = 0;
    let tempDate = new Date(startDate);

    while (tempDate < currentDate) {
        const dayOfWeek = getDay(tempDate);
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // 1=Seg, 5=Sex
            const endOfDay = new Date(tempDate);
            endOfDay.setHours(23, 59, 59, 999);
            const effectiveEndDate = currentDate < endOfDay ? currentDate : endOfDay;
            
            businessHours += (effectiveEndDate.getTime() - tempDate.getTime());
        }
        tempDate = addDays(tempDate, 1);
        tempDate.setHours(0, 0, 0, 0);
    }
    return businessHours / (1000 * 60 * 60); // Converte de ms para horas
};

const getCobrancaTicketDisplayStatus = (ticket: CobrancaTicket): CobrancaTicketStatus => {
    const ticketDateString = ticket.created_at || ticket.data_atend;
    
    // Se o status não for 'Aberta', retorna o status atual.
    if (ticket.status !== 'Aberta' || !ticketDateString || !isValid(parseISO(ticketDateString))) {
        return ticket.status; 
    }
    
    let ticketDate = parseISO(ticketDateString);
    const dayOfWeek = getDay(ticketDate);

    if (dayOfWeek === 6) { ticketDate = addDays(ticketDate, 2); ticketDate.setHours(8, 0, 0, 0); } 
    else if (dayOfWeek === 0) { ticketDate = addDays(ticketDate, 1); ticketDate.setHours(8, 0, 0, 0); }

    const hoursSinceCreation = getBusinessHours(ticketDate);
    
    // Se o ticket tiver mais de 24h úteis E AINDA estiver como "Aberta", está fora do prazo
    if (hoursSinceCreation > 24) {
        return "Fora do prazo";
    }

    return ticket.status; // Retorna 'Aberta' se estiver dentro do prazo
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
    
    const isCobrança = isCobrancaTicket(ticket);
    const displayStatus = isCobrança ? getCobrancaTicketDisplayStatus(ticket) : ticket.status;
    
    const StatusIcon = statusIcons[displayStatus as TicketStatus | CobrancaTicketStatus] || TicketIcon;
    const submissionDate = isCobrança ? (ticket.created_at || ticket.data_atend) : ticket.submission_date;
    const reason = isCobrança ? ticket.motivo : ticket.reason;
    const protocolDisplay = isCobrança 
        ? String(ticket.protocolo ?? '').padStart(4, '0') 
        : String(ticket.protocol).padStart(4, '0');
    const responsible = isCobrança ? ticket.gerente : ticket.responsible;

    return (
        <Card className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex-grow space-y-2">
                <div className="flex items-center gap-2">
                     <p className="text-sm text-muted-foreground">#{protocolDisplay}</p>
                    {isCobrança ? (
                        <Badge variant="outline" className="border-red-500 text-red-600 flex items-center gap-1">
                            <Briefcase className="h-3 w-3"/>
                            Apoio Jacareí
                        </Badge>
                    ) : (
                         <Badge variant="outline" className="border-blue-500 text-blue-600 flex items-center gap-1">
                            <Headset className="h-3 w-3"/>
                            Suporte GRE
                        </Badge>
                    )}
                </div>
                <p className="font-semibold text-lg">{reason}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4"/> 
                        {submissionDate && isValid(parseISO(submissionDate))
                            ? `Enviado ${formatDistanceToNow(parseISO(submissionDate), { addSuffix: true, locale: ptBR })}`
                            : 'Data de envio indisponível'
                        }
                    </span>
                    {isCobrança && ticket.nome_cliente && (
                        <span className="flex items-center gap-1.5"><User className="h-4 w-4"/> Cliente: {ticket.nome_cliente}</span>
                    )}
                    {isCobrança && ticket.vendedor && (
                        <span className="flex items-center gap-1.5"><User className="h-4 w-4"/> Vendedor: {ticket.vendedor}</span>
                    )}
                    {responsible && (
                        <span className="flex items-center gap-1.5"><User className="h-4 w-4"/> Responsável: {responsible}</span>
                    )}
                    <Badge variant={displayStatus === 'Concluído' || displayStatus === 'Resolvida' ? 'default' : displayStatus === 'Atrasado' || displayStatus === 'Fora do prazo' ? 'destructive' : 'secondary'} className={`${statusColors[displayStatus as TicketStatus | CobrancaTicketStatus]} text-white`}>
                        {displayStatus}
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
  const { user, email } = useAuth();
  
  type FilterType = 'Todos' | 'Suporte' | 'Cobrança';
  const [filterType, setFilterType] = useState<FilterType>('Todos');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [gerenteFilter, setGerenteFilter] = useState('Todos');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | CobrancaTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const myTickets = useMemo(() => {
    if (!user || !email) return [];
    
    // Tickets de Suporte onde o usuário logado é o criador
    const mySupportTickets = supportTickets.filter(t => t.user_id === user.id);

    let myCobrancaTickets: CobrancaTicket[] = [];

    // Regra especial para Naira: vê todos os tickets da diretora Simone
    if (email === 'naira.nunes@portovaleconsorcios.com.br') {
        myCobrancaTickets = cobrancaTickets.filter(t => t.email_diretor === 'simone@portovaleconsorcios.com.br');
    } else {
        // Regra geral para outros gerentes e diretores
        myCobrancaTickets = cobrancaTickets.filter(t => 
            t.email_gerente === email || 
            t.email_diretor === email
        );
    }
    
    const allTickets: (Ticket | CobrancaTicket)[] = [
      ...mySupportTickets,
      ...myCobrancaTickets
    ];
    
    // Remove duplicatas caso um ticket apareça em mais de uma lista
    return Array.from(new Map(allTickets.map(item => [item.id, item])).values());
  }, [supportTickets, cobrancaTickets, user, email]);


  const filteredTickets = useMemo(() => {
    return myTickets.filter(ticket => {
        const isCobrança = isCobrancaTicket(ticket);
        const displayStatus = isCobrança ? getCobrancaTicketDisplayStatus(ticket) : ticket.status;

        const typeMatch = 
            filterType === 'Todos' ||
            (filterType === 'Suporte' && !isCobrança) ||
            (filterType === 'Cobrança' && isCobrança);

        const statusMatch = statusFilter === 'Todos' || displayStatus === statusFilter;
        
        const gerente = isCobrança ? ticket.gerente : ticket.responsible;
        const gerenteMatch = gerenteFilter === 'Todos' || gerente === gerenteFilter;
        
        const cleanedSearchTerm = searchTerm.trim().toLowerCase();
        const protocolValue = isCobrança 
            ? String(ticket.protocolo ?? '') 
            : String(ticket.protocol);
        const protocolPadded = protocolValue.padStart(4, '0');
        const protocolMatch = protocolValue.includes(cleanedSearchTerm) || protocolPadded.includes(cleanedSearchTerm);

        const reason = isCobrança ? ticket.motivo : ticket.reason;
        const searchMatch = protocolMatch || reason.toLowerCase().includes(cleanedSearchTerm);

        return typeMatch && searchMatch && statusMatch && gerenteMatch;
    }).sort((a, b) => {
        const dateAString = isCobrancaTicket(a) ? (a.created_at || a.data_atend) : a.submission_date;
        const dateBString = isCobrancaTicket(b) ? (b.created_at || b.data_atend) : b.submission_date;

        if (!dateAString || !isValid(parseISO(dateAString))) return 1;
        if (!dateBString || !isValid(parseISO(dateBString))) return -1;

        return parseISO(dateBString).getTime() - parseISO(dateAString).getTime();
    });
  }, [myTickets, searchTerm, filterType, statusFilter, gerenteFilter]);

  const stats = useMemo(() => {
    const relevantTickets = myTickets;
    return {
        total: relevantTickets.length,
        pending: relevantTickets.filter(t => t.status !== 'Concluído' && t.status !== 'Resolvida').length,
        completed: relevantTickets.filter(t => t.status === 'Concluído' || t.status === 'Resolvida').length
    };
  }, [myTickets]);

  const availableStatuses = useMemo(() => {
    const statuses = new Set(filteredTickets.map(ticket => isCobrancaTicket(ticket) ? getCobrancaTicketDisplayStatus(ticket) : ticket.status));
    return ['Todos', ...Array.from(statuses)];
  }, [filteredTickets]);
  
  const availableGerentes = useMemo(() => {
      const gerentes = new Set(filteredTickets.map(ticket => {
          return isCobrancaTicket(ticket) ? ticket.gerente : ticket.responsible;
      }).filter(Boolean) as string[]);
      return ['Todos', ...Array.from(gerentes)];
  }, [filteredTickets]);

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
                          aria-label="Ver Apoio Jacareí"
                          className="data-[state=on]:bg-red-500 data-[state=on]:text-white"
                        >
                          Apoio Jacareí
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </div>
        </Card>
        
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Pesquise pelo protocolo ou motivo da solicitação" 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <ListFilter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableStatuses.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={gerenteFilter} onValueChange={setGerenteFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <User className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Gerente/Responsável" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableGerentes.map(gerente => (
                                <SelectItem key={gerente} value={gerente}>{gerente}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
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
                isUserResponseView={true}
            />
        )}
    </div>
  );
}