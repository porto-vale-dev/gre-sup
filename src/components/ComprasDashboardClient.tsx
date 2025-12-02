"use client";

import { useState, useMemo } from 'react';
import { useComprasTickets } from '@/contexts/ComprasTicketContext';
import type { ComprasTicket } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, ShoppingCart, Package, Eye } from 'lucide-react';
import { format, parseISO } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { ComprasTicketDetailsModal } from './ComprasTicketDetailsModal';

const statusColors = {
  pending: "bg-yellow-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
};

const getStatusDisplay = (aprovado: boolean | null) => {
  if (aprovado === null) return { label: "Pendente", color: statusColors.pending };
  if (aprovado === true) return { label: "Aprovado", color: statusColors.approved };
  return { label: "Reprovado", color: statusColors.rejected };
};

const ComprasTicketCard = ({ 
  ticket, 
  onOpenDetails 
}: { 
  ticket: ComprasTicket; 
  onOpenDetails: (ticket: ComprasTicket) => void;
}) => {
  const statusInfo = getStatusDisplay(ticket.aprovado ?? null);
  const displayDate = ticket.created_at ? format(parseISO(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Pedido #{ticket.id}</CardTitle>
          </div>
          <Badge className={`${statusInfo.color} text-white`}>
            {statusInfo.label}
          </Badge>
        </div>
        <CardDescription className="text-xs mt-1">
          {displayDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-semibold">{ticket.produto}</p>
          <p className="text-xs text-muted-foreground">
            Quantidade: {ticket.quantidade} | Total: R$ {parseFloat(ticket.total).toFixed(2)}
          </p>
          {ticket.tamanho && (
            <p className="text-xs text-muted-foreground">Tamanho: {ticket.tamanho}</p>
          )}
        </div>
        <div className="border-t pt-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Solicitante:</span> {ticket.email}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Retirada:</span> {ticket.retirada.toUpperCase()}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Folha ABAC:</span> {ticket.folha ? 'Sim' : 'Não'}
          </p>
        </div>
        {ticket.usuario_compras && (
          <div className="border-t pt-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Processado por:</span> {ticket.usuario_compras}
            </p>
          </div>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-2"
          onClick={() => onOpenDetails(ticket)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
};

export function ComprasDashboardClient() {
  const { tickets, isLoading, error } = useComprasTickets();
  const { username } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<ComprasTicket | null>(null);

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = 
        ticket.produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toString().includes(searchTerm);

      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'pending' && ticket.aprovado === null) ||
        (statusFilter === 'approved' && ticket.aprovado === true) ||
        (statusFilter === 'rejected' && ticket.aprovado === false);

      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const pending = tickets.filter(t => t.aprovado === null).length;
    const approved = tickets.filter(t => t.aprovado === true).length;
    const rejected = tickets.filter(t => t.aprovado === false).length;
    return { pending, approved, rejected, total: tickets.length };
  }, [tickets]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro ao Carregar Pedidos</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Package className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <Package className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reprovados</CardTitle>
              <Package className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por produto, email ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="rejected">Reprovados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum pedido encontrado com os filtros aplicados.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTickets.map(ticket => (
              <ComprasTicketCard
                key={ticket.id}
                ticket={ticket}
                onOpenDetails={setSelectedTicket}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedTicket && (
        <ComprasTicketDetailsModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          currentUser={username || 'Usuário'}
        />
      )}
    </>
  );
}
