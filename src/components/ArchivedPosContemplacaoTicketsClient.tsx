
"use client";

import { useState, useMemo, useEffect } from 'react';
import { usePosContemplacaoTickets } from '@/contexts/PosContemplacaoTicketContext';
import type { PosContemplacaoTicket, PosContemplacaoTicketStatus } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, Info, LayoutGrid, List, User, AlertCircle, Calendar as CalendarIcon, ExternalLink, Ticket as TicketIcon, MessageSquare } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { POS_CONTEMPLACAO_STATUSES, RESPONSAVEIS, MOTIVOS_POS_CONTEMPLACAO } from '@/lib/posContemplacaoData';
import { useAuth } from '@/contexts/AuthContext';
import { PosContemplacaoTicketDetailsModal } from './PosContemplacaoTicketDetailsModal';

const statusColors: Record<PosContemplacaoTicketStatus, string> = {
  "Aberto": "bg-blue-500",
  "Em Análise": "bg-yellow-500",
  "Concluído": "bg-green-500",
  "Urgente": "bg-red-500",
  "Retorno": "bg-pink-500",
};

const ArchivedPosContemplacaoTicketCard = ({ ticket, onOpenDetails, onStatusChange }: { ticket: PosContemplacaoTicket; onOpenDetails: (ticket: PosContemplacaoTicket) => void; onStatusChange: (ticketId: string, status: PosContemplacaoTicketStatus) => void; }) => {
    const protocolDisplay = ticket.protocolo ? String(ticket.protocolo).padStart(4, '0') : ticket.id.substring(0, 8);
    
    const findNameByEmail = (email: string) => {
        const user = RESPONSAVEIS.find(r => r.email.toLowerCase() === email.toLowerCase());
        return user ? user.name : email;
    };

    const relatorName = findNameByEmail(ticket.relator);
    const responsavelName = findNameByEmail(ticket.responsavel);
    
    const dataLimite = ticket.data_limite ? parseISO(ticket.data_limite) : null;
    const formattedDataLimite = dataLimite && isValid(dataLimite) ? format(dataLimite, "dd/MM/yy", { locale: ptBR }) : 'N/D';

    return (
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-headline text-primary flex items-center gap-2">
                        {ticket.motivo.length > 30 ? `${ticket.motivo.substring(0,27)}...` : ticket.motivo}
                    </CardTitle>
                    <Badge variant='default' className={`whitespace-nowrap ${statusColors[ticket.status]} text-white`}>
                        {ticket.status}
                    </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                    <span className="flex items-center gap-1.5"><TicketIcon className="h-3.5 w-3.5" /> Protocolo #{protocolDisplay}</span>
                    <span className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" /> {isValid(parseISO(ticket.created_at)) ? format(parseISO(ticket.created_at), "dd/MM/yy", { locale: ptBR }) : 'Data N/A'}</span>
                    <span className="flex items-center gap-1.5 font-medium"><CalendarIcon className="h-3.5 w-3.5 text-red-500" /> Limite: {formattedDataLimite}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm flex-grow">
                 <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Relator: {relatorName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Responsável: {responsavelName}</span>
                </div>
                 <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Cliente: {ticket.nome_cliente}</span>
                </div>
                <div className="flex items-center gap-2 pt-2">
                    <Select value={ticket.status} onValueChange={(newStatus) => onStatusChange(ticket.id, newStatus as PosContemplacaoTicketStatus)}>
                        <SelectTrigger className="h-9 text-xs w-full" aria-label="Mudar status do ticket">
                            <SelectValue placeholder="Mudar status" />
                        </SelectTrigger>
                        <SelectContent>
                        {POS_CONTEMPLACAO_STATUSES.map(s => (
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


export function ArchivedPosContemplacaoTicketsClient() {
  const { tickets, isLoading, error, fetchTickets, updateTicket } = usePosContemplacaoTickets();
  const { cargo, email } = useAuth();
  
  const [selectedTicket, setSelectedTicket] = useState<PosContemplacaoTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [responsibleFilter, setResponsibleFilter] = useState<string>("Todos");
  const [motivoFilter, setMotivoFilter] = useState<string>("Todos");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [tempDate, setTempDate] = useState<DateRange | undefined>(undefined);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  const [deadlineDate, setDeadlineDate] = useState<DateRange | undefined>(undefined);
  const [tempDeadlineDate, setTempDeadlineDate] = useState<DateRange | undefined>(undefined);
  const [isDeadlinePopoverOpen, setIsDeadlinePopoverOpen] = useState(false);
  
  const archivedTickets = useMemo(() => {
    const baseTickets = tickets.filter(ticket => ticket.status === "Concluído");
    if (cargo === 'gre_con' && email) {
        return baseTickets.filter(ticket => ticket.relator === email || ticket.responsavel === email);
    }
    return baseTickets;
  }, [tickets, cargo, email]);

  useEffect(() => {
    if(isDatePopoverOpen) setTempDate(date);
  }, [isDatePopoverOpen, date]);
  
  useEffect(() => {
    if(isDeadlinePopoverOpen) setTempDeadlineDate(deadlineDate);
  }, [isDeadlinePopoverOpen, deadlineDate]);

   const responsibleForFilter = useMemo(() => {
    return ["Todos", ...RESPONSAVEIS.map(r => r.name)];
  }, []);

  const filteredAndSortedTickets = useMemo(() => {
    return archivedTickets
      .filter(ticket => {
        const protocolDisplay = ticket.protocolo ? String(ticket.protocolo).padStart(4, '0') : ticket.id.substring(0, 8);
        const cleanedSearchTerm = searchTerm.toLowerCase();
        
        const searchMatch = ticket.nome_cliente.toLowerCase().includes(cleanedSearchTerm) ||
                            protocolDisplay.toLowerCase().includes(cleanedSearchTerm) ||
                            ticket.motivo.toLowerCase().includes(cleanedSearchTerm);
        
        const responsibleMatch = responsibleFilter === "Todos" || ticket.responsavel === responsibleFilter;
        const motivoMatch = motivoFilter === "Todos" || ticket.motivo === motivoFilter;

        let dateMatch = true;
        if (date?.from) {
            const ticketDate = ticket.created_at;
            if (ticketDate && isValid(parseISO(ticketDate))) {
                const fromDate = new Date(date.from.setHours(0, 0, 0, 0));
                const toDate = date.to ? new Date(date.to.setHours(23, 59, 59, 999)) : fromDate;
                const submissionDate = parseISO(ticketDate);
                dateMatch = submissionDate >= fromDate && submissionDate <= toDate;
            } else {
                dateMatch = false;
            }
        }
        
        let deadlineMatch = true;
        if (deadlineDate?.from) {
            const ticketDeadline = ticket.data_limite;
            if (ticketDeadline && isValid(parseISO(ticketDeadline))) {
                const fromDate = new Date(deadlineDate.from.setHours(0, 0, 0, 0));
                const toDate = deadlineDate.to ? new Date(deadlineDate.to.setHours(23, 59, 59, 999)) : fromDate;
                const submissionDeadline = parseISO(ticketDeadline);
                deadlineMatch = submissionDeadline >= fromDate && submissionDeadline <= toDate;
            } else {
                deadlineMatch = false;
            }
        }

        return searchMatch && dateMatch && deadlineMatch && responsibleMatch && motivoMatch;
      })
      .sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      });
  }, [archivedTickets, searchTerm, sortOrder, date, deadlineDate, responsibleFilter, motivoFilter]);

  const handleOpenDetails = (ticket: PosContemplacaoTicket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
  };

   const handleStatusChange = (ticketId: string, status: PosContemplacaoTicketStatus) => {
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
                    aria-label="Buscar tickets de Pós-Contemplação arquivados"
                />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto items-center shrink-0">
                <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button id="date" variant={"outline"} size="icon" className={cn("w-full sm:w-10", !date && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={tempDate} onSelect={setTempDate} numberOfMonths={1} locale={ptBR}/>
                    <div className="p-2 border-t flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setDate(undefined); setTempDate(undefined); setIsDatePopoverOpen(false); }}>Limpar</Button>
                      <Button size="sm" onClick={() => { setDate(tempDate); setIsDatePopoverOpen(false); }}>Aplicar</Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover open={isDeadlinePopoverOpen} onOpenChange={setIsDeadlinePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button id="deadlineDate" variant={"outline"} size="icon" className={cn("w-full sm:w-10", !deadlineDate && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4 text-red-500" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar initialFocus mode="range" defaultMonth={deadlineDate?.from} selected={tempDeadlineDate} onSelect={setTempDeadlineDate} numberOfMonths={1} locale={ptBR}/>
                    <div className="p-2 border-t flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setDeadlineDate(undefined); setTempDeadlineDate(undefined); setIsDeadlinePopoverOpen(false); }}>Limpar</Button>
                      <Button size="sm" onClick={() => { setDeadlineDate(tempDeadlineDate); setIsDeadlinePopoverOpen(false); }}>Aplicar</Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Select value={motivoFilter} onValueChange={setMotivoFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrar por motivo">
                        <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Filtrar por motivo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Todos">Todos os Motivos</SelectItem>
                        {MOTIVOS_POS_CONTEMPLACAO.map(motivo => (
                            <SelectItem key={motivo} value={motivo}>{motivo}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrar por responsável">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Filtrar por responsável" />
                    </SelectTrigger>
                    <SelectContent>
                        {responsibleForFilter.map(resp => (
                            <SelectItem key={resp} value={resp}>{resp}</SelectItem>
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
                <ToggleGroup type="single" value={viewMode} onValueChange={(value) => {if(value) setViewMode(value as "grid" | "list")}}>
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
             {cargo === 'gre_con' 
              ? "Não há tickets concluídos sob sua responsabilidade ou criados por você que correspondam aos filtros."
              : "Não há tickets concluídos que correspondam aos filtros."
            }
          </AlertDescription>
        </Alert>
      ) : (
        <div className={`gap-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}`}>
          {filteredAndSortedTickets.map(ticket => (
            <ArchivedPosContemplacaoTicketCard 
              key={ticket.id} 
              ticket={ticket} 
              onOpenDetails={handleOpenDetails}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
       {selectedTicket && (
        <PosContemplacaoTicketDetailsModal
          ticket={selectedTicket}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
