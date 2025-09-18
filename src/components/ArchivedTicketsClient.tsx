
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useTickets } from '@/contexts/TicketContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Ticket } from '@/types';
import { TicketCard } from '@/components/TicketCard';
import { TicketDetailsModal } from '@/components/TicketDetailsModal';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, Info, LayoutGrid, List, User, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

export function ArchivedTicketsClient() {
  const { tickets, isLoadingTickets, error, fetchTickets } = useTickets();
  const { cargo, username } = useAuth();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [responsibleFilter, setResponsibleFilter] = useState<string>("Todos");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Date filter state
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [tempDate, setTempDate] = useState<DateRange | undefined>(undefined);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  // Sync tempDate with official date when popover opens
  useEffect(() => {
    if(isDatePopoverOpen) {
      setTempDate(date);
    }
  }, [isDatePopoverOpen, date]);


  const archivedTickets = useMemo(() => {
    const baseTickets = tickets.filter(ticket => ticket.status === "Concluído");

    // Filter tickets for 'gre' and 'gre_apoio_admin' roles
    if ((cargo === 'gre' || cargo === 'gre_apoio_admin') && username) {
        return baseTickets.filter(ticket => ticket.responsible === username);
    }

    return baseTickets;
  }, [tickets, cargo, username]);

  const responsibleNamesForFilter = useMemo(() => {
    const allResponsibles = new Set(tickets.map(t => t.responsible).filter(Boolean) as string[]);
    return ["Todos", ...Array.from(allResponsibles), "não atribuído"];
  }, [tickets]);

  const filteredAndSortedTickets = useMemo(() => {
    return archivedTickets
      .filter(ticket => {
        const cleanedSearchTerm = searchTerm.toLowerCase().replace(/^#/, '');
        const searchMatch = ticket.name.toLowerCase().includes(cleanedSearchTerm) ||
                            String(ticket.protocol).padStart(4, '0').includes(cleanedSearchTerm) ||
                            ticket.reason.toLowerCase().includes(cleanedSearchTerm) ||
                            (ticket.responsible && ticket.responsible.toLowerCase().includes(cleanedSearchTerm));
        
        const responsibleMatch = (() => {
          if (cargo === 'gre' || cargo === 'gre_apoio_admin') return true;
          if (responsibleFilter === "Todos") return true;
          if (responsibleFilter === "não atribuído") return !ticket.responsible;
          return ticket.responsible?.toLowerCase() === responsibleFilter.toLowerCase();
        })();

        let dateMatch = true;
        if (date?.from) {
            const fromDate = new Date(date.from);
            fromDate.setHours(0, 0, 0, 0); // Start of the day

            const toDate = date.to ? new Date(date.to) : new Date(date.from);
            toDate.setHours(23, 59, 59, 999); // End of the day

            const submissionDate = new Date(ticket.submission_date);
            dateMatch = submissionDate >= fromDate && submissionDate <= toDate;
        }

        return searchMatch && responsibleMatch && dateMatch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.submission_date).getTime();
        const dateB = new Date(b.submission_date).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
  }, [archivedTickets, searchTerm, responsibleFilter, sortOrder, date, cargo]);

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
          <p>Não foi possível buscar os dados do banco de dados. Isso pode ser causado por um problema de permissão (Row Level Security no Supabase) ou de conexão.</p>
          <p className="mt-2 text-xs"><strong>Detalhes do erro:</strong> {error}</p>
          <Button onClick={() => fetchTickets()} className="mt-4">Tentar Novamente</Button>
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
              placeholder="Buscar por protocolo, nome, motivo, responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
              aria-label="Buscar tickets arquivados"
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
            
            {(cargo === 'adm' || cargo === 'greadmin') && (
              <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                <SelectTrigger className="w-full sm:w-[150px]" aria-label="Filtrar por responsável">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filtrar por responsável" />
                </SelectTrigger>
                <SelectContent>
                  {responsibleNamesForFilter.map(name => (
                    <SelectItem key={name} value={name} className="capitalize">{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}


            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "asc" | "desc")}>
              <SelectTrigger className="w-full sm:w-[150px]" aria-label="Ordenar por data">
                <SelectValue placeholder="Ordenar por data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Mais Recentes</SelectItem>
                <SelectItem value="asc">Mais Antigos</SelectItem>
              </SelectContent>
            </Select>
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => { if (value) setViewMode(value as "grid" | "list") }} className="hidden sm:flex">
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
             {(cargo === 'gre' || cargo === 'gre_apoio_admin')
                ? "Não há tickets concluídos atribuídos a você."
                : "Não há tickets concluídos para exibir aqui que correspondam aos seus filtros."
             }
          </AlertDescription>
        </Alert>
      ) : (
        <div className={`gap-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}`}>
          {filteredAndSortedTickets.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} onOpenDetails={handleOpenDetails} />
          ))}
        </div>
      )}

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
