
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { CobrancaTicket, CobrancaTicketStatus, CreateCobrancaTicket, RetornoComercialStatus } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './AuthContext';
import { gerentesPorDiretor } from '@/lib/cobrancaData';

interface CobrancaTicketContextType {
  tickets: CobrancaTicket[];
  isLoading: boolean;
  error: string | null;
  addTicket: (ticketData: CreateCobrancaTicket) => Promise<boolean>;
  updateTicket: (ticketId: string, updates: Partial<CobrancaTicket>) => Promise<void>;
  updateRetornoComercial: (
    ticketId: string, 
    status: RetornoComercialStatus, 
    observacoes: string
  ) => Promise<boolean>;
  getTicketById: (ticketId: string) => CobrancaTicket | undefined;
  fetchTickets: () => void;
}

const CobrancaTicketContext = createContext<CobrancaTicketContextType | undefined>(undefined);

export function CobrancaTicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<CobrancaTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const fetchTickets = useCallback(async () => {
    if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase
        .rpc('get_cobranca_tickets_for_user');

      if (rpcError) {
        throw new Error(`Erro ao buscar tickets de apoio: ${rpcError.message}. Verifique a função 'get_cobranca_tickets_for_user' no Supabase.`);
      }
      
      // A RPC agora deve retornar a coluna 'protocolo'
      setTickets(data || []);

    } catch (err: any) {
        const errorMessage = err.message || 'Ocorreu um erro desconhecido.';
        setError(errorMessage);
        toast({ title: "Erro ao Carregar Tickets de Apoio", description: errorMessage, variant: "destructive" });
        console.error("Error fetching cobranca tickets:", err);
    } finally {
      setIsLoading(false);
    }
  }, [toast, isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      fetchTickets();
    } else if (!isAuthLoading && !isAuthenticated) {
      setTickets([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, fetchTickets]);


  const addTicket = async (ticketData: CreateCobrancaTicket): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (!user) throw new Error("Usuário não autenticado.");

      const gerenteEmail = 
        gerentesPorDiretor[ticketData.diretor]?.find(g => g.name === ticketData.gerente)?.email || null;

      // O campo 'protocolo' é gerado pelo banco de dados agora, então não o enviamos.
      const payload = {
        ...ticketData,
        email_gerente: gerenteEmail,
        user_id: user.id,
        data_atend: new Date().toISOString(),
        status: 'Aberta' as CobrancaTicketStatus,
      };
      
      const { error: insertError } = await supabase.from('tickets_cobranca').insert(payload);
        
      if (insertError) {
        throw new Error(`Erro ao salvar ticket: ${insertError.message}`);
      }

      toast({ title: "Ticket de Apoio Criado", description: "Sua solicitação foi registrada com sucesso." });
      await fetchTickets();
      return true;

    } catch (err: any) {
      toast({ title: "Erro ao Criar Ticket", description: err.message, variant: "destructive" });
      console.error("Error adding cobranca ticket:", err);
      return false;
    } finally {
        setIsLoading(false);
    }
  };

  const updateTicket = async (ticketId: string, updates: Partial<CobrancaTicket>) => {
    if (!('status' in updates) || !updates.status) {
        toast({ title: "Erro Interno", description: "Nenhum status fornecido para atualização.", variant: "destructive" });
        return;
    }

    const { error: rpcError } = await supabase.rpc('update_cobranca_ticket_status', {
        p_ticket_id: ticketId,
        p_new_status: updates.status,
    });

    if (rpcError) {
      console.error('RPC Error updating status:', rpcError);
      toast({ title: "Erro ao Atualizar", description: `Não foi possível atualizar o status. Detalhes: ${rpcError.message}`, variant: "destructive" });
      return;
    }

    toast({ title: "Status Atualizado!", description: `O status do ticket foi alterado para ${updates.status}.` });
    await fetchTickets();
  };

  const updateRetornoComercial = async (ticketId: string, status: RetornoComercialStatus, observacoes: string): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('update_retorno_comercial', {
        p_ticket_id: ticketId,
        p_status_retorno: status,
        p_obs_retorno: observacoes,
      });

      if (error) {
        // This error will now be more meaningful if it comes from the RPC function.
        throw new Error(`Não foi possível salvar o retorno: ${error.message}`);
      }
      
      toast({
        title: "Sucesso!",
        description: "O retorno do comercial foi salvo.",
      });
      await fetchTickets();
      return true;

    } catch (err: any) {
       toast({
        title: "Erro ao Salvar",
        description: err.message || "Ocorreu uma falha desconhecida.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getTicketById = (ticketId: string): CobrancaTicket | undefined => {
    return tickets.find(ticket => ticket.id === ticketId);
  };


  return (
    <CobrancaTicketContext.Provider value={{ 
        tickets, 
        isLoading,
        error, 
        addTicket, 
        updateTicket,
        updateRetornoComercial,
        getTicketById,
        fetchTickets, 
    }}>
      {children}
    </CobrancaTicketContext.Provider>
  );
}

export function useCobrancaTickets() {
  const context = useContext(CobrancaTicketContext);
  if (context === undefined) {
    throw new Error('useCobrancaTickets must be used within a CobrancaTicketProvider');
  }
  return context;
}
