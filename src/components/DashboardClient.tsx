
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTickets } from '@/contexts/TicketContext';
import type { Ticket } from '@/types';
import { TicketCard } from '@/components/TicketCard';
import { TicketDetailsModal } from '@/components/TicketDetailsModal';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, ListFilter, Info, LayoutGrid, List, User, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLocalStorage } from '@/hooks/useLocalStorage';

export function DashboardClient() {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();
  const { tickets, isLoadingTickets, error, fetchTickets } = useTickets();
  const router = useRouter();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [responsibleFilter, setResponsibleFilter] = useState<string>("Todos");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // desc for newest first
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [responsibleHistory, setResponsibleHistory] = useLocalStorage<string[]>('responsibleHistory', []);

  useEffect(() => {
    if (!authIsLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authIsLoading, router]);


  const activeTickets = useMemo(() => {
    return tickets.filter(ticket => ticket.status !== "Concluído");
  }, [tickets]);

  const filteredAndSortedTickets = useMemo(() => {
    return activeTickets
      .filter(ticket => {
        const searchMatch = ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            ticket.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (ticket.responsible && ticket.responsible.toLowerCase().includes(searchTerm.toLowerCase()));
        const statusMatch = statusFilter === "Todos" || ticket.status === statusFilter;
        const responsibleMatch = responsibleFilter === "Todos" || ticket.responsible === responsibleFilter;
        return searchMatch && statusMatch && responsibleMatch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.submission_date).getTime();
        const dateB = new Date(b.submission_date).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
  }, [activeTickets, searchTerm, statusFilter, responsibleFilter, sortOrder]);

  const handleOpenDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
  };

  const ticketStatusesForFilter = useMemo(() => {
    // Exclude "Concluído" from active tickets filter
    return ["Todos", ...new Set(activeTickets.map(t => t.status).filter(s => s !== "Concluído"))];
  }, [activeTickets]);

  const responsibleNamesForFilter = useMemo(() => {
    return ["Todos", ...new Set(activeTickets.map(t => t.responsible).filter(Boolean) as string[])];
  }, [activeTickets]);

  const responsibleSuggestions = useMemo(() => {
    const allNames = new Set([
        ...responsibleHistory, 
        ...tickets.map(t => t.responsible).filter(Boolean) as string[]
    ]);
    return Array.from(allNames).sort();
  }, [tickets, responsibleHistory]);

  useEffect(() => {
    if (tickets.length > 0) {
      setResponsibleHistory(prevHistory => {
        const currentHistorySet = new Set(prevHistory);
        const newNames = tickets.map(t => t.responsible).filter(Boolean) as string[];
        
        let hasChanged = false;
        newNames.forEach(name => {
          if (!currentHistorySet.has(name)) {
            currentHistorySet.add(name);
            hasChanged = true;
          }
        });

        return hasChanged ? Array.from(currentHistorySet).sort() : prevHistory;
      });
    }
  }, [tickets, setResponsibleHistory]);


  if (authIsLoading || isLoadingTickets || (!isAuthenticated && !authIsLoading) ) {
    return (
      <div className="space-y-6">
         <div className="flex flex-col lg:flex-row gap-2 items-center w-full p-4 bg-card border rounded-lg shadow">
          <Skeleton className="h-10 w-full lg:flex-grow" />
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto items-center shrink-0">
            <Skeleton className="h-10 w-full sm:w-[180px]" />
            <Skeleton className="h-10 w-full sm:w-[180px]" />
            <Skeleton className="h-10 w-full sm:w-[180px]" />
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
                    placeholder="Buscar por nome, motivo, responsável..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                    aria-label="Buscar tickets ativos"
                />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto items-center shrink-0">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrar por status">
                        <ListFilter className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                        {ticketStatusesForFilter.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrar por responsável">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Filtrar por responsável" />
                    </SelectTrigger>
                    <SelectContent>
                        {responsibleNamesForFilter.map(name => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "asc" | "desc")}>
                    <SelectTrigger className="w-full sm:w-[180px]" aria-label="Ordenar por data">
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
          <AlertTitle className="text-primary">Nenhum Ticket Ativo Encontrado</AlertTitle>
          <AlertDescription>
            Não há tickets ativos que correspondam aos seus filtros atuais ou nenhum ticket foi aberto ainda (que não esteja concluído).
          </AlertDescription>
        </Alert>
      ) : (
        <div className={`gap-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}`}>
          {filteredAndSortedTickets.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} onOpenDetails={handleOpenDetails} responsibleSuggestions={responsibleSuggestions} />
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
