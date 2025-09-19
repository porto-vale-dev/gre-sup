

"use client";

import { useState, useMemo, useEffect } from 'react';
import { useCobrancaTickets } from '@/contexts/CobrancaTicketContext';
import type { CobrancaTicket, CobrancaTicketStatus } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, Info, LayoutGrid, List, User, AlertCircle, Calendar as CalendarIcon, ExternalLink, Ticket as TicketIcon, ListFilter } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, addDays, getDay, isValid } from "date-fns";
import { ptBR } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { CobrancaTicketDetailsModal } from './CobrancaTicketDetailsModal';
import { COBRANCA_TICKET_STATUSES, diretores, gerentesPorDiretor } from '@/lib/cobrancaData';
import { useAuth } from '@/contexts/AuthContext';


const statusColors: Record<CobrancaTicketStatus, string> = {
  "Aberta": "bg-blue-500",
  "Em análise": "bg-yellow-500",
  "Respondida": "bg-purple-600",
  "Encaminhada": "bg-orange-500",
  "Reabertura": "bg-pink-500",
  "Resolvida": "bg-green-500",
  "Dentro do prazo": "bg-teal-500",
  "Fora do prazo": "bg-red-500",
};

// Função para calcular horas úteis (seg-sex)
const getBusinessHours = (startDate: Date): number => {
    let currentDate = new Date();
    let businessHours = 0;
    let tempDate = new Date(startDate);

    while (tempDate < currentDate) {
        const dayOfWeek = getDay(tempDate);
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // 1=Seg, 5=Sex
            // Calcula o fim do dia atual ou a data final, o que vier primeiro
            const endOfDay = new Date(tempDate);
            endOfDay.setHours(23, 59, 59, 999);
            const effectiveEndDate = currentDate < endOfDay ? currentDate : endOfDay;
            
            businessHours += (effectiveEndDate.getTime() - tempDate.getTime());
        }
        // Avança para o próximo dia
        tempDate = addDays(tempDate, 1);
        tempDate.setHours(0, 0, 0, 0);
    }
    return businessHours / (1000 * 60 * 60); // Converte de ms para horas
};


const getTicketDisplayStatus = (ticket: CobrancaTicket): CobrancaTicketStatus => {
    const ticketDateString = ticket.created_at || ticket.data_atend;
    
    // Se não há data ou o status não é 'Aberta', retorna o status atual.
    if (ticket.status !== 'Aberta' || !ticketDateString || !isValid(parseISO(ticketDateString))) {
        return ticket.status; 
    }
    
    let ticketDate = parseISO(ticketDateString);
    const dayOfWeek = getDay(ticketDate);

    // Se o ticket foi criado no sábado (6) ou domingo (0), ajusta a data de início para a próxima segunda-feira às 8h
    if (dayOfWeek === 6) { // Sábado
        ticketDate = addDays(ticketDate, 2);
        ticketDate.setHours(8, 0, 0, 0);
    } else if (dayOfWeek === 0) { // Domingo
        ticketDate = addDays(ticketDate, 1);
        ticketDate.setHours(8, 0, 0, 0);
    }

    const hoursSinceCreation = getBusinessHours(ticketDate);
    
    // Se o ticket tiver mais de 24h úteis E AINDA estiver como "Aberta", está fora do prazo
    if (hoursSinceCreation > 24) {
        return "Fora do prazo";
    }

    return ticket.status; // Retorna 'Aberta' se estiver dentro do prazo
};


const ArchivedCobrancaTicketCard = ({ ticket, onOpenDetails, onStatusChange }: { ticket: CobrancaTicket; onOpenDetails: (ticket: CobrancaTicket) => void; onStatusChange: (ticketId: string, status: CobrancaTicketStatus) => void; }) => {
    const protocolDisplay = ticket.protocolo ? String(ticket.protocolo).padStart(4, '0') : ticket.id.substring(0, 8);
    const displayStatus = getTicketDisplayStatus(ticket);
    const displayDate = ticket.created_at || ticket.data_atend;

    return (
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-headline text-primary flex items-center gap-2">
                        {ticket.motivo.length > 30 ? `${ticket.motivo.substring(0,27)}...` : ticket.motivo}
                    </CardTitle>
                    <Badge variant='default' className={`whitespace-nowrap ${statusColors[displayStatus]} text-white`}>
                        {displayStatus}
                    </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground flex items-center gap-4 pt-1">
                    <span className="flex items-center gap-1.5"><TicketIcon className="h-3.5 w-3.5" /> Protocolo #{protocolDisplay}</span>
                    <span className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" /> {displayDate ? format(parseISO(displayDate), "dd/MM/yyyy", { locale: ptBR }) : 'Data N/A'}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm flex-grow">
                 <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Diretor: {ticket.diretor}</span>
                </div>
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Gerente: {ticket.gerente}</span>
                </div>
                 <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Cliente: {ticket.nome_cliente}</span>
                </div>
                <div className="flex items-center gap-2 pt-2">
                    <Select value={ticket.status} onValueChange={(newStatus) => onStatusChange(ticket.id, newStatus as CobrancaTicketStatus)}>
                        <SelectTrigger className="h-9 text-xs w-full" aria-label="Mudar status do ticket">
                            <SelectValue placeholder="Mudar status" />
                        </SelectTrigger>
                        <SelectContent>
                        {COBRANCA_TICKET_STATUSES.map(s => (
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
};


export function ArchivedCobrancaTicketsClient() {
  const { tickets, isLoading, error, fetchTickets, updateTicket } = useCobrancaTickets();
  const { user, cargo } = useAuth();
  
  const [selectedTicket, setSelectedTicket] = useState<CobrancaTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [diretorFilter, setDiretorFilter] = useState<string>("Todos");
  const [gerenteFilter, setGerenteFilter] = useState<string>("Todos");
  const [availableGerentes, setAvailableGerentes] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [tempDate, setTempDate] = useState<DateRange | undefined>(undefined);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  
    useEffect(() => {
        const allGerentes = Object.values(gerentesPorDiretor).flat().map(g => g.name);
        const uniqueGerentes = ["Gerentes", ...Array.from(new Set(allGerentes))];
        if (diretorFilter === 'Todos') {
            setAvailableGerentes(uniqueGerentes);
        } else {
            const gerentes = gerentesPorDiretor[diretorFilter]?.map(g => g.name) || [];
            setAvailableGerentes(["Gerentes", ...gerentes]);
        }
        setGerenteFilter("Gerentes");
    }, [diretorFilter]);


  useEffect(() => {
    if(isDatePopoverOpen) {
      setTempDate(date);
    }
  }, [isDatePopoverOpen, date]);
  
  const archivedTickets = useMemo(() => {
    const baseTickets = tickets.filter(ticket => ticket.status === "Resolvida");
    
    if (cargo === 'gre_apoio' && user) {
        return baseTickets.filter(ticket => ticket.user_id === user.id);
    }
    
    return baseTickets;
  }, [tickets, cargo, user]);

  const filteredAndSortedTickets = useMemo(() => {
    return archivedTickets
      .filter(ticket => {
        const protocolDisplay = ticket.protocolo ? String(ticket.protocolo).padStart(4, '0') : ticket.id.substring(0, 8);
        const cleanedSearchTerm = searchTerm.toLowerCase();
        
        const searchMatch = ticket.nome_cliente.toLowerCase().includes(cleanedSearchTerm) ||
                            protocolDisplay.toLowerCase().includes(cleanedSearchTerm) ||
                            ticket.motivo.toLowerCase().includes(cleanedSearchTerm);
        
        const diretorMatch = diretorFilter === "Todos" || ticket.diretor === diretorFilter;
        const gerenteMatch = gerenteFilter === "Gerentes" || ticket.gerente === gerenteFilter;

        let dateMatch = true;
        if (date?.from) {
            const ticketDate = ticket.created_at || ticket.data_atend;
            if (ticketDate) {
                const fromDate = new Date(date.from);
                fromDate.setHours(0, 0, 0, 0);
                const toDate = date.to ? new Date(date.to) : new Date(date.from);
                toDate.setHours(23, 59, 59, 999);
                const submissionDate = new Date(ticketDate);
                dateMatch = submissionDate >= fromDate && submissionDate <= toDate;
            } else {
                dateMatch = false; // Ticket has no date to filter by
            }
        }

        return searchMatch && dateMatch && diretorMatch && gerenteMatch;
      })
      .sort((a, b) => {
        const dateA = a.created_at || a.data_atend;
        const dateB = b.created_at || b.data_atend;
        if (!dateA || !dateB) return 0;
        const timeA = new Date(dateA).getTime();
        const timeB = new Date(dateB).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      });
  }, [archivedTickets, searchTerm, sortOrder, date, diretorFilter, gerenteFilter]);

  const handleOpenDetails = (ticket: CobrancaTicket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
  };

   const handleStatusChange = (ticketId: string, status: CobrancaTicketStatus) => {
    updateTicket(ticketId, { status });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
         <div className="flex flex-col lg:flex-row gap-2 items-center w-full p-4 bg-card border rounded-lg shadow">
          <Skeleton className="h-10 w-full lg:flex-grow" />
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto items-center shrink-0">
            <Skeleton className="h-10 w-full sm:w-[150px]" />
            <Skeleton className="h-10 w-20 hidden sm:block" />
          </div>
        </div>
        <div className={`gap-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}`}>
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-lg" />)}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>Erro ao Carregar os Tickets</AlertTitle>
        <AlertDescription>
          <p>Não foi possível buscar os dados do banco de dados.</p>
          <p className="mt-2 text-xs"><strong>Detalhes do erro:</strong> {error}</p>
          <Button onClick={fetchTickets} className="mt-4">Tentar Novamente</Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-card border rounded-lg shadow">
        <div className="flex flex-col lg:flex-row gap-2 items-center w-full">
            <div className="relative w-full lg:flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar por protocolo, cliente, motivo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                    aria-label="Buscar tickets de cobrança arquivados"
                />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto items-center shrink-0">
                <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full sm:w-auto px-3 justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        date && "bg-[#5F5F5F] text-white hover:bg-[#5F5F5F]/90 hover:text-white"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from}
                      selected={tempDate}
                      onSelect={setTempDate}
                      numberOfMonths={1}
                      locale={ptBR}
                    />
                    <div className="p-2 border-t flex justify-end gap-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                                setDate(undefined);
                                setTempDate(undefined);
                                setIsDatePopoverOpen(false);
                            }}
                        >
                            Limpar
                        </Button>
                        <Button 
                            size="sm" 
                            onClick={() => {
                                setDate(tempDate);
                                setIsDatePopoverOpen(false);
                            }}
                        >
                            Aplicar
                        </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Select value={diretorFilter} onValueChange={setDiretorFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrar por diretor">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Diretores" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Todos">Diretores</SelectItem>
                        {diretores.map(diretor => (
                            <SelectItem key={diretor.name} value={diretor.name}>{diretor.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={gerenteFilter} onValueChange={setGerenteFilter} disabled={availableGerentes.length <= 1}>
                    <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrar por gerente">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Filtrar por gerente" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableGerentes.map(gerente => (
                            <SelectItem key={gerente} value={gerente}>{gerente}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "asc" | "desc")}>
                    <SelectTrigger className="w-full sm:w-[150px]" aria-label="Ordenar por data">
                         <SelectValue placeholder="Ordenar por data" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="desc">Mais Recentes</SelectItem>
                        <SelectItem value="asc">Mais Antigos</SelectItem>
                    </SelectContent>
                </Select>
                <ToggleGroup type="single" value={viewMode} onValueChange={(value) => {if(value) setViewMode(value as "grid" | "list")}} className="hidden sm:flex">
                    <ToggleGroupItem value="grid" aria-label="Visualização em grade">
                        <LayoutGrid className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="list" aria-label="Visualização em lista">
                        <List className="h-4 w-4" />
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>
        </div>
      </div>

      {filteredAndSortedTickets.length === 0 ? (
        <Alert variant="default" className="mt-6 border-primary/50 bg-primary/5">
          <Info className="h-5 w-5 text-primary" />
          <AlertTitle className="text-primary">Nenhum Ticket Arquivado</AlertTitle>
          <AlertDescription>
            {cargo === 'gre_apoio' 
              ? "Não há tickets resolvidos criados por você que correspondam aos filtros."
              : "Não há tickets de Apoio ao Comercial resolvidos para exibir aqui."
            }
          </AlertDescription>
        </Alert>
      ) : (
        <div className={`gap-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}`}>
          {filteredAndSortedTickets.map(ticket => (
            <ArchivedCobrancaTicketCard 
              key={ticket.id} 
              ticket={ticket} 
              onOpenDetails={handleOpenDetails}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
       {selectedTicket && (
        <CobrancaTicketDetailsModal
          ticket={selectedTicket}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

    
