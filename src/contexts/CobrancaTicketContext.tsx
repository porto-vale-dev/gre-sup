

"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { CobrancaTicket, CobrancaTicketStatus, CreateCobrancaTicket, RetornoComercialStatus } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './AuthContext';
import { gerentesPorDiretor, diretores } from '@/lib/cobrancaData';

interface CobrancaTicketContextType {
  tickets: CobrancaTicket[];
  isLoading: boolean;
  error: string | null;
  addTicket: (ticketData: CreateCobrancaTicket) => Promise<boolean>;
  updateTicket: (ticketId: string, updates: Partial<CobrancaTicket>) => Promise<void>;
  updateTicketDetailsAndRetorno: (
    ticketId: string,
    details: { diretor: string; gerente: string; observacoes: string },
  ) => Promise<boolean>;
  saveUserResponse: (
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
    // This function will now fetch tickets for ANY authenticated user.
    // The responsibility for filtering WHO can see WHAT is now on the page components themselves.
    if (!isAuthenticated) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase
        .from('tickets_cobranca')
        .select('*')
        .order('created_at', { ascending: false });

      if (rpcError) {
        throw new Error(`Erro ao buscar tickets de apoio: ${rpcError.message}. Verifique a tabela 'tickets_cobranca' no Supabase.`);
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

      const diretorData = diretores.find(
        d => d.name.trim().toLowerCase() === ticketData.diretor.trim().toLowerCase()
      );
      const diretorEmail = diretorData?.email || null;

      const gerenteData = gerentesPorDiretor[ticketData.diretor]?.find(
        g => g.name.trim().toLowerCase() === ticketData.gerente.trim().toLowerCase()
      );
      
      if (!gerenteData) {
        throw new Error(`Gerente "${ticketData.gerente}" não encontrado ou não pertence ao diretor "${ticketData.diretor}". Verifique os dados em \`src/lib/cobrancaData.ts\``);
      }

      const gerenteEmail = gerenteData.email;
      const celularGerente = gerenteData.celular;
      
      const payload = {
        nome_cliente: ticketData.nome_cliente,
        cpf: ticketData.cpf,
        cota: ticketData.cota,
        producao: ticketData.producao,
        telefone: ticketData.telefone,
        email: ticketData.email,
        diretor: ticketData.diretor,
        gerente: ticketData.gerente,
        motivo: ticketData.motivo,
        observacoes: ticketData.observacoes,
        user_id: user.id,
        email_gerente: gerenteEmail,
        email_diretor: diretorEmail,
        status: 'Aberta' as CobrancaTicketStatus,
      };

      const { data: newTicketData, error: insertError } = await supabase
        .from('tickets_cobranca')
        .insert(payload)
        .select()
        .single();
        
      if (insertError) {
        throw new Error(`Erro ao salvar ticket: ${insertError.message}`);
      }

      if (newTicketData) {
        // Disparar o webhook para N8N para novo ticket
        const webhookUrl = "https://n8n.portovaleconsorcio.com.br/webhook-test/213124asd144das";
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo_evento: 'novo_ticket',
                protocolo: String(newTicketData.protocolo).padStart(4, '0'),
                motivo: newTicketData.motivo,
                nome_gerente: ticketData.gerente,
                celular_gerente: celularGerente,
            }),
        }).catch(webhookError => {
            console.error("Webhook para N8N falhou:", webhookError);
             toast({
                title: "Aviso de Webhook",
                description: "O ticket foi criado, mas a notificação pode não ter sido enviada.",
                variant: "default",
            });
        });
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
  
  const updateTicketDetailsAndRetorno = async (
    ticketId: string,
    details: { diretor: string; gerente: string; observacoes: string },
  ): Promise<boolean> => {
    try {
      const { data: currentTicket, error: fetchError } = await supabase
        .from('tickets_cobranca')
        .select('protocolo, motivo, status')
        .eq('id', ticketId)
        .single();
      
      if (fetchError || !currentTicket) {
        throw new Error("Não foi possível encontrar o ticket para atualização.");
      }

      const gerenteData = gerentesPorDiretor[details.diretor]?.find(g => g.name === details.gerente);
      const gerenteEmail = gerenteData?.email || null;
      const celularGerente = gerenteData?.celular || null;

      const diretorData = diretores.find(d => d.name === details.diretor);
      const diretorEmail = diretorData?.email || null;

      const updates: { [key: string]: any } = {
        diretor: details.diretor,
        gerente: details.gerente,
        email_gerente: gerenteEmail,
        email_diretor: diretorEmail,
        observacoes: details.observacoes,
        status: 'Reabertura', // Altera o status para 'Reabertura' sempre
      };
      
      const { error } = await supabase
        .from('tickets_cobranca')
        .update(updates)
        .eq('id', ticketId);

      if (error) {
        throw new Error(`Erro ao atualizar o ticket: ${error.message}`);
      }

      // Webhook é disparado ao salvar detalhes, notificando como reabertura
      const webhookUrl = "https://n8n.portovaleconsorcio.com.br/webhook-test/213124asd144das";
      fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              tipo_evento: 'reabertura',
              protocolo: String(currentTicket.protocolo).padStart(4, '0'),
              motivo: currentTicket.motivo,
              nome_gerente: details.gerente,
              celular_gerente: celularGerente,
          }),
      }).catch(webhookError => console.error("Webhook de reabertura falhou:", webhookError));


      toast({ title: "Sucesso!", description: "As informações do ticket foram salvas e o status atualizado para 'Reabertura'." });
      await fetchTickets();
      return true;

    } catch (err: any) {
      toast({ title: "Erro ao Salvar", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const saveUserResponse = async (
      ticketId: string,
      statusRetorno: RetornoComercialStatus,
      obsRetorno: string
  ): Promise<boolean> => {
      try {
          const { data: updatedTicket, error } = await supabase
              .from('tickets_cobranca')
              .update({
                  status_retorno: statusRetorno,
                  obs_retorno: obsRetorno,
                  status: 'Respondida'
              })
              .eq('id', ticketId)
              .select('protocolo, motivo, user_id, gerente')
              .single();

          if (error) {
            throw new Error(`Não foi possível salvar o retorno: ${error.message}`);
          }
          
          if(updatedTicket && updatedTicket.user_id) {
              const { data: profileData, error: profileError } = await supabase
                  .from('profiles')
                  .select('username')
                  .eq('id', updatedTicket.user_id)
                  .single();

              if(profileError) {
                  console.warn(`Could not fetch creator's username: ${profileError.message}`);
              }
              
              const creatorUsername = profileData?.username || null;
              
              const webhookUrl = "https://n8n.portovaleconsorcio.com.br/webhook-test/nvrjgvnrejbgeerespostaticket";

              fetch(webhookUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      tipo_evento: 'resposta_ticket',
                      protocolo: String(updatedTicket.protocolo).padStart(4, '0'),
                      motivo: updatedTicket.motivo,
                      user_id: updatedTicket.user_id, // ID do criador do ticket
                      username_criador: creatorUsername, // Nome do criador do ticket
                      nome_gerente: updatedTicket.gerente, // Nome do gerente
                  }),
              }).catch(webhookError => {
                  console.error("Webhook de resposta de ticket falhou:", webhookError);
                  // Optional: inform user that notification might have failed
              });
          }

          toast({ title: "Resposta Enviada", description: "Sua resposta foi salva e o status do ticket foi atualizado para 'Respondida'." });
          await fetchTickets();
          return true;

      } catch(err: any) {
          toast({ title: "Erro ao Salvar Resposta", description: err.message, variant: "destructive" });
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
        updateTicketDetailsAndRetorno,
        saveUserResponse,
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
