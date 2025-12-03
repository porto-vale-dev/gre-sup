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
import { Search, Package, Eye, CheckCircle, XCircle } from 'lucide-react';
import { format, parseISO } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { ComprasTicketDetailsModal } from './ComprasTicketDetailsModal';

// ===== Agrupamento por pedido (mesmo dia + horário/minuto, mesmo solicitante e mesma retirada) =====
type ComprasOrder = {
  groupId: string;
  createdAtDisplay: string;
  email: string;
  retirada: string;
  folha: boolean;
  aprovado: boolean | null;
  usuario_compras?: string | null;
  entrega?: boolean | null;
  entregador?: string | null;
  items: Array<Pick<ComprasTicket, 'id' | 'produto' | 'quantidade' | 'tamanho' | 'total'>>;
  totalValue: number;
  totalQty: number;
};

function groupTicketsToOrders(tickets: ComprasTicket[]): ComprasOrder[] {
  const map = new Map<string, ComprasOrder>();
  for (const t of tickets) {
    const minuteKey = t.created_at ? format(parseISO(t.created_at), 'yyyy-MM-dd HH:mm') : 'N/A';
    const key = `${minuteKey}|${t.email}|${t.retirada}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        groupId: key,
        createdAtDisplay: t.created_at ? format(parseISO(t.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A',
        email: t.email,
        retirada: t.retirada,
        folha: !!t.folha,
        aprovado: t.aprovado ?? null,
        usuario_compras: t.usuario_compras ?? null,
        entrega: t.entrega ?? null,
        entregador: t.entregador ?? null,
        items: [{ id: t.id, produto: t.produto, quantidade: t.quantidade, tamanho: t.tamanho ?? null, total: t.total }],
        totalValue: parseFloat(t.total || '0'),
        totalQty: t.quantidade,
      });
    } else {
      existing.items.push({ id: t.id, produto: t.produto, quantidade: t.quantidade, tamanho: t.tamanho ?? null, total: t.total });
      existing.totalValue += parseFloat(t.total || '0');
      existing.totalQty += t.quantidade;
      existing.folha = existing.folha || !!t.folha;
      existing.usuario_compras = existing.usuario_compras ?? (t.usuario_compras ?? null);
    }
  }
  return Array.from(map.values());
}

const ArchivedOrderCard = ({ order, onOpenDetails }: { order: ComprasOrder; onOpenDetails: (order: ComprasOrder) => void }) => {
  const isDelivered = order.entrega === true;
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Pedido #{order.items[0]?.id}</CardTitle>
          </div>
          <Badge className={`${isDelivered ? 'bg-green-500' : 'bg-red-500'} text-white`}>
            {isDelivered ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Entregue
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Reprovado
              </>
            )}
          </Badge>
        </div>
        <CardDescription className="text-xs mt-1">{order.createdAtDisplay}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-semibold">Itens ({order.items.length})</p>
          <div className="text-xs text-muted-foreground space-y-1">
            {order.items.map((it) => (
              <p key={it.id}>
                {it.produto} — Qty: {it.quantidade}{it.tamanho ? ` — ${it.tamanho}` : ''} — R$ {parseFloat(it.total).toFixed(2)}
              </p>
            ))}
          </div>
          <p className="text-xs font-medium pt-2">Total do Pedido: R$ {order.totalValue.toFixed(2)}</p>
        </div>
        <div className="border-t pt-3">
          <p className="text-xs text-muted-foreground"><span className="font-medium">Solicitante:</span> {order.email}</p>
          <p className="text-xs text-muted-foreground"><span className="font-medium">Retirada:</span> {order.retirada.toUpperCase()}</p>
          <p className="text-xs text-muted-foreground"><span className="font-medium">Folha de Pagamento:</span> {order.folha ? 'Sim' : 'Não'}</p>
        </div>
        {order.usuario_compras && (
          <div className="border-t pt-2">
            <p className="text-xs text-muted-foreground"><span className="font-medium">Aprovado por:</span> {order.usuario_compras}</p>
          </div>
        )}
        {order.entregador && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground"><span className="font-medium">Entregue por:</span> {order.entregador}</p>
          </div>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-2"
          onClick={() => onOpenDetails(order)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
};
const ArchivedComprasTicketCard = ({ 
  ticket, 
  onOpenDetails 
}: { 
  ticket: ComprasTicket; 
  onOpenDetails: (ticket: ComprasTicket) => void;
}) => {
  const isApproved = ticket.aprovado === true;
  const displayDate = ticket.created_at ? format(parseISO(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Pedido #{ticket.id}</CardTitle>
          </div>
          <Badge className={`${isApproved ? 'bg-green-500' : 'bg-red-500'} text-white`}>
            {isApproved ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Aprovado
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Reprovado
              </>
            )}
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

export function ArchivedComprasTicketsClient() {
  const { tickets, isLoading, error } = useComprasTickets();
  const { username } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<ComprasTicket | null>(null);

  const archivedTickets = useMemo(() => {
    return tickets.filter(ticket => ticket.entrega === true || ticket.aprovado === false);
  }, [tickets]);

  const archivedOrders = useMemo(() => groupTicketsToOrders(archivedTickets), [archivedTickets]);

  const filteredOrders = useMemo(() => {
    return archivedOrders.filter(order => {
      const matchesSearch = 
        order.items.some(it => it.produto.toLowerCase().includes(searchTerm.toLowerCase())) ||
        order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.items[0]?.id?.toString() || '').includes(searchTerm);

      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'approved' && order.aprovado === true) ||
        (statusFilter === 'rejected' && order.aprovado === false);

      return matchesSearch && matchesStatus;
    });
  }, [archivedOrders, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const approved = archivedOrders.filter(o => o.aprovado === true).length;
    const rejected = archivedOrders.filter(o => o.aprovado === false).length;
    return { approved, rejected, total: archivedOrders.length };
  }, [archivedOrders]);

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
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Processados</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reprovados</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
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
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="rejected">Reprovados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Pedidos (agrupados) */}
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
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {archivedOrders.length === 0 
                  ? 'Nenhum pedido processado ainda.'
                  : 'Nenhum pedido encontrado com os filtros aplicados.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map(order => (
              <ArchivedOrderCard
                key={order.groupId}
                order={order}
                onOpenDetails={(ord) => {
                  const firstId = ord.items[0]?.id;
                  const first = tickets.find(t => t.id === firstId) || null;
                  if (first) setSelectedTicket(first);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedTicket && (
        <ComprasTicketDetailsModal
          ticket={selectedTicket}
          groupItems={filteredOrders.find(o => o.items[0]?.id === selectedTicket.id)?.items}
          groupMeta={(filteredOrders.find(o => o.items[0]?.id === selectedTicket.id)) ? {
            createdAtDisplay: filteredOrders.find(o => o.items[0]?.id === selectedTicket.id)!.createdAtDisplay,
            email: filteredOrders.find(o => o.items[0]?.id === selectedTicket.id)!.email,
            retirada: filteredOrders.find(o => o.items[0]?.id === selectedTicket.id)!.retirada,
            folha: filteredOrders.find(o => o.items[0]?.id === selectedTicket.id)!.folha,
            aprovado: filteredOrders.find(o => o.items[0]?.id === selectedTicket.id)!.aprovado,
            usuario_compras: filteredOrders.find(o => o.items[0]?.id === selectedTicket.id)!.usuario_compras ?? null,
          } : undefined}
          onClose={() => setSelectedTicket(null)}
          currentUser={username || 'Usuário'}
        />
      )}
    </>
  );
}
