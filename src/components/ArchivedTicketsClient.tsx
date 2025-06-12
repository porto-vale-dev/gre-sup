
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
import { Search, Info, LayoutGrid, List, User } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ArchivedTicketsClient() {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();
  const { tickets } = useTickets();
  const router = useRouter();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [responsibleFilter, setResponsibleFilter] = useState<string>("Todos");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (!authIsLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authIsLoading, router]);

  const archivedTickets = useMemo(() => {
    return tickets.filter(ticket => ticket.status === "Concluído");
  }, [tickets]);

  const filteredAndSortedTickets = useMemo(() => {
    return archivedTickets
      .filter(ticket => {
        const searchMatch = ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            ticket.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (ticket.responsible && ticket.responsible.toLowerCase().includes(searchTerm.toLowerCase()));
        const responsibleMatch = responsibleFilter === "Todos" || ticket.responsible === responsibleFilter;
        return searchMatch && responsibleMatch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.submissionDate).getTime();
        const dateB = new Date(b.submissionDate).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
  }, [archivedTickets, searchTerm, responsibleFilter, sortOrder]);

  const handleOpenDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
  };

  const responsibleNamesForFilter = useMemo(() => {
    return ["Todos", ...new Set(archivedTickets.map(t => t.responsible).filter(Boolean) as string[])];
  }, [archivedTickets]);

  if (authIsLoading || !isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Skeleton className="h-10 w-full sm:w-64" />
          <Skeleton className="h-10 w-full sm:w-48" />
          <Skeleton className="h-10 w-full sm:w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-lg" />)}
        </div>
      </div>
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
              aria-label="Buscar tickets arquivados"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto items-center shrink-0">
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
            Não há tickets concluídos para exibir aqui.
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
