
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
import { Search, ListFilter, Info, LayoutGrid, List, User, AlertCircle, Calendar as CalendarIcon, ExternalLink, Ticket as TicketIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { ptBR } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { COBRANCA_TICKET_STATUSES } from '@/lib/cobrancaData';


const statusColors: Record<CobrancaTicketStatus, string> = {
  "Aberta": "bg-blue-500",
  "Em análise": "bg-yellow-500",
  "Encaminhada": "bg-orange-500",
  "Resolvida": "bg-green-500",
  "Dentro do prazo": "bg-teal-500",
  "Fora do prazo": "bg-red-500",
};

const CobrancaTicketCard = ({ ticket, onOpenDetails }: { ticket: CobrancaTicket; onOpenDetails: (ticket: CobrancaTicket) => void; }) => {
    const protocolDisplay = ticket.id.substring(0, 8); 

    return (
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-headline text-primary flex items-center gap-2">
                        {ticket.motivo.length > 30 ? `${ticket.motivo.substring(0,27)}...` : ticket.motivo}
                    </CardTitle>
                    <Badge variant={ticket.status === 'Resolvida' ? 'default' : ticket.status === 'Fora do prazo' ? 'destructive' : 'secondary'} className={`whitespace-nowrap ${statusColors[ticket.status]} text-white`}>
                        {ticket.status}
                    </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground flex items-center gap-4 pt-1">
                    <span className="flex items-center gap-1.5"><TicketIcon className="h-3.5 w-3.5" /> Protocolo #{protocolDisplay}</span>
                    <span className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" /> {format(parseISO(ticket.data_atend), "dd/MM/yyyy", { locale: ptBR })}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm flex-grow">
                 <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Diretor: {ticket.diretor}</span>
                </div>
                 <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Cliente: {ticket.nome_cliente}</span>
                </div>
            </CardContent>
            <CardFooter>
                 <Button variant="outline" size="sm" className="w-full" onClick={() => onOpenDetails(ticket)}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver Detalhes (Em breve)
                </Button>
            </CardFooter>
        </Card>
    );
};


export function CobrancaDashboardClient() {
  const { tickets, isLoading, error, fetchTickets } = useCobrancaTickets();
  
  const [selectedTicket, setSelectedTicket] = useState<CobrancaTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); 
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [tempDate, setTempDate] = useState<DateRange | undefined>(undefined);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  useEffect(() => {
    if(isDatePopoverOpen) {
      setTempDate(date);
    }
  }, [isDatePopoverOpen, date]);
  
  const filteredAndSortedTickets = useMemo(() => {
    return tickets
      .filter(ticket => {
        const protocolDisplay = ticket.id.substring(0, 8);
        const cleanedSearchTerm = searchTerm.toLowerCase();
        
        const searchMatch = ticket.nome_cliente.toLowerCase().includes(cleanedSearchTerm) ||
                            protocolDisplay.toLowerCase().includes(cleanedSearchTerm) ||
                            ticket.motivo.toLowerCase().includes(cleanedSearchTerm);

        const statusMatch = statusFilter === "Todos" || ticket.status === statusFilter;
        
        let dateMatch = true;
        if (date?.from) {
            const fromDate = new Date(date.from);
            fromDate.setHours(0, 0, 0, 0); 
            const toDate = date.to ? new Date(date.to) : new Date(date.from);
            toDate.setHours(23, 59, 59, 999); 
            const submissionDate = new Date(ticket.data_atend);
            dateMatch = submissionDate >= fromDate && submissionDate <= toDate;
        }

        return searchMatch && statusMatch && dateMatch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.data_atend).getTime();
        const dateB = new Date(b.data_atend).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
  }, [tickets, searchTerm, statusFilter, sortOrder, date]);

  const handleOpenDetails = (ticket: CobrancaTicket) => {
    // Modal for details is not yet implemented for cobranca tickets
    // setSelectedTicket(ticket);
    // setIsModalOpen(true);
  };

  const ticketStatusesForFilter = useMemo(() => {
    return ["Todos", ...COBRANCA_TICKET_STATUSES];
  }, []);


  if (isLoading) {
    return (
      <div className="space-y-6">
         <div className="flex flex-col lg:flex-row gap-2 items-center w-full p-4 bg-card border rounded-lg shadow">
          <Skeleton className="h-10 w-full lg:flex-grow" />
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto items-center shrink-0">
            <Skeleton className="h-10 w-full sm:w-[150px]" />
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
                    aria-label="Buscar tickets de cobrança"
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

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]" aria-label="Filtrar por status">
                        <ListFilter className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                        {ticketStatusesForFilter.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
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
          <AlertTitle className="text-primary">Nenhum Ticket de Apoio Encontrado</AlertTitle>
          <AlertDescription>
            Não há tickets de Apoio ao Comercial que correspondam aos seus filtros.
          </AlertDescription>
        </Alert>
      ) : (
        <div className={`gap-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}`}>
          {filteredAndSortedTickets.map(ticket => (
            <CobrancaTicketCard key={ticket.id} ticket={ticket} onOpenDetails={handleOpenDetails} />
          ))}
        </div>
      )}
    </div>
  );
}
