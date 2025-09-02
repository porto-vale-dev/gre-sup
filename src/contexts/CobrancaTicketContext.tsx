
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { CobrancaTicket, CobrancaTicketStatus, CreateCobrancaTicket } from '@/types';
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
  fetchTickets: () => void;
}

const CobrancaTicketContext = createContext<CobrancaTicketContextType | undefined>(undefined);

export function CobrancaTicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<CobrancaTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const fetchTickets = useCallback(async () => {
    if (!isAuthenticated) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('tickets_cobranca')
        .select('*')
        .order('data_atend', { ascending: false });

      if (fetchError) {
        throw new Error(`Erro ao buscar tickets de apoio: ${fetchError.message}`);
      }
      
      setTickets(data || []);

    } catch (err: any) {
        const errorMessage = err.message || 'Ocorreu um erro desconhecido.';
        setError(errorMessage);
        toast({ title: "Erro ao Carregar Tickets de Apoio", description: errorMessage, variant: "destructive" });
        console.error("Error fetching cobranca tickets:", err);
    } finally {
      setIsLoading(false);
    }
  }, [toast, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
    } else {
      setTickets([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchTickets]);


  const addTicket = async (ticketData: CreateCobrancaTicket): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (!user) throw new Error("Usuário não autenticado.");

      const allGerentes = Object.values(gerentesPorDiretor).flat();
      const selectedGerente = allGerentes.find(g => g.name === ticketData.gerente);

      const payload = {
        ...ticketData,
        gerente_email: selectedGerente?.email,
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
    const { error: updateError } = await supabase
      .from('tickets_cobranca')
      .update(updates)
      .eq('id', ticketId);

    if (updateError) {
      toast({ title: "Erro ao Atualizar", description: updateError.message, variant: "destructive" });
      return;
    }

    toast({ title: "Ticket Atualizado", description: `O ticket foi atualizado com sucesso.` });
    
    await fetchTickets();
  };

  return (
    <CobrancaTicketContext.Provider value={{ 
        tickets, 
        isLoading,
        error, 
        addTicket, 
        updateTicket,
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
