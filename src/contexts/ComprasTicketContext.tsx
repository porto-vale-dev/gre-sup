"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ComprasTicket } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './AuthContext';

interface ComprasTicketContextType {
  tickets: ComprasTicket[];
  isLoading: boolean;
  error: string | null;
  updateTicketStatus: (ticketId: number, aprovado: boolean, usuarioCompras: string) => Promise<boolean>;
  markAsDelivered: (ticketId: number, entregador: string) => Promise<boolean>;
  getTicketById: (ticketId: number) => ComprasTicket | undefined;
  fetchTickets: () => void;
}

const ComprasTicketContext = createContext<ComprasTicketContextType | undefined>(undefined);

export function ComprasTicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<ComprasTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const fetchTickets = useCallback(async () => {
    if (!isAuthenticated) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const { data, error: fetchError } = await supabase
            .from('compras')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (fetchError) {
            throw new Error(`Erro ao buscar pedidos de compras: ${fetchError.message}`);
        }

        setTickets(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido ao buscar pedidos.';
      setError(message);
      toast({
        title: 'Erro ao Buscar Pedidos',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, toast]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      fetchTickets();
    }
  }, [fetchTickets, isAuthenticated, isAuthLoading]);

  const updateTicketStatus = async (ticketId: number, aprovado: boolean, usuarioCompras: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('compras')
        .update({ 
          aprovado,
          usuario_compras: usuarioCompras
        })
        .eq('id', ticketId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      toast({
        title: aprovado ? 'Pedido Aprovado' : 'Pedido Reprovado',
        description: `O pedido foi ${aprovado ? 'aprovado' : 'reprovado'} com sucesso.`,
      });

      await fetchTickets();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar pedido.';
      toast({
        title: 'Erro ao Atualizar',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const getTicketById = (ticketId: number): ComprasTicket | undefined => {
    return tickets.find(t => t.id === ticketId);
  };

  const markAsDelivered = async (ticketId: number, entregador: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('compras')
        .update({ 
          entrega: true,
          entregador
        })
        .eq('id', ticketId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      toast({
        title: 'Entrega Registrada',
        description: 'O pedido foi marcado como entregue.',
      });

      await fetchTickets();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar entrega.';
      toast({
        title: 'Erro ao Registrar Entrega',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const value = {
    tickets,
    isLoading,
    error,
    updateTicketStatus,
    markAsDelivered,
    getTicketById,
    fetchTickets,
  };

  return (
    <ComprasTicketContext.Provider value={value}>
      {children}
    </ComprasTicketContext.Provider>
  );
}

export function useComprasTickets() {
  const context = useContext(ComprasTicketContext);
  if (context === undefined) {
    throw new Error('useComprasTickets must be used within a ComprasTicketProvider');
  }
  return context;
}
