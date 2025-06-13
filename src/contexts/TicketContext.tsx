
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Ticket, TicketStatus, TicketFile } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './AuthContext'; // To potentially link tickets to users

// Define the name of your Supabase Storage bucket for ticket files
const TICKET_FILES_BUCKET = 'ticket-files';


interface TicketContextType {
  tickets: Ticket[];
  isLoadingTickets: boolean;
  addTicket: (ticketData: {
    name: string;
    phone: string;
    reason: string;
    estimatedResponseTime: string;
    observations?: string;
    file?: File; // Changed from TicketFile to raw File for upload
  }) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => Promise<void>;
  updateTicketResponsible: (ticketId: string, responsible: string) => Promise<void>;
  getTicketById: (ticketId: string) => Ticket | undefined;
  fetchTickets: () => Promise<void>;
  downloadFile: (filePath: string, fileName: string) => Promise<void>;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authIsLoading } = useAuth();

  const fetchTickets = useCallback(async () => {
    if (authIsLoading) {
      // console.log("Auth is loading, deferring ticket fetch.");
      // Set loading false because we are not actually fetching yet.
      // Or, you could keep isLoadingTickets true until auth is resolved and fetch actually runs.
      // For now, let's prevent flicker by setting it true only when fetch actually starts.
      return;
    }

    // If RLS policies require authentication to read tickets,
    // and the user is not authenticated, we might choose not to fetch
    // or expect the fetch to fail (which should be handled gracefully).
    // For now, we proceed, and RLS will enforce permissions.

    setIsLoadingTickets(true);
    try {
      const { data, error: queryError } = await supabase
        .from('tickets')
        .select('*')
        .order('submissionDate', { ascending: false });

      if (queryError) {
        throw queryError; // Throw the Supabase error to be caught by the catch block
      }

      if (!data) {
        // This case should ideally not happen if queryError is null,
        // but as a safeguard:
        throw new Error("Dados não recebidos do Supabase, mas nenhum erro explícito foi reportado.");
      }

      const formattedTickets = data.map(ticket => ({
        ...ticket,
        submissionDate: ticket.submissionDate || ticket.created_at,
        file: ticket.file_path ? {
          name: ticket.file_name,
          type: ticket.file_type,
          size: ticket.file_size,
          path: ticket.file_path,
        } : undefined,
      })) as Ticket[];
      setTickets(formattedTickets);

    } catch (errorCaught: any) {
      let errorMessage = "Ocorreu um erro desconhecido ao buscar os tickets.";
      let errorToLog: any = errorCaught;

      if (errorCaught && typeof errorCaught.message === 'string' && errorCaught.message.trim() !== '') {
        errorMessage = errorCaught.message;
      } else if (typeof errorCaught === 'string' && errorCaught.trim() !== '') {
        errorMessage = errorCaught;
      } else if (errorCaught) {
        // Attempt to get more details if it's an object without a direct message
        try {
          const errorString = JSON.stringify(errorCaught);
          if (errorString !== '{}') { // Avoid just showing "{}"
            errorMessage = `Detalhes do erro: ${errorString}`;
          } else if (typeof errorCaught.toString === 'function') {
            const objStr = errorCaught.toString();
            if (objStr !== '[object Object]') { // Avoid generic useless string
                errorMessage = `Erro: ${objStr}`;
            }
          }
        } catch (e) {
          // JSON.stringify or toString failed
        }
      }
      
      toast({ 
        title: "Erro ao Carregar Tickets", 
        description: errorMessage, 
        variant: "destructive" 
      });
      console.error("Original error object during fetchTickets:", errorToLog);
      if (errorMessage !== "Ocorreu um erro desconhecido ao buscar os tickets." && (!errorToLog || errorToLog.message !== errorMessage)) {
         console.error("Processed error message for toast:", errorMessage);
      }
    } finally {
      setIsLoadingTickets(false);
    }
  }, [toast, authIsLoading, isAuthenticated]); // Added authIsLoading and isAuthenticated

  useEffect(() => {
    // Fetch tickets only when authentication status is resolved.
    // If isAuthenticated is false, fetchTickets might still be called
    // and fail if RLS blocks anonymous reads, which is expected.
    // The key is that authIsLoading being false means we know the auth state.
    if (!authIsLoading) {
      fetchTickets();
    }
  }, [fetchTickets, authIsLoading, isAuthenticated]); // Ensure dependencies are correct


  const addTicket = async (ticketData: {
    name: string;
    phone: string;
    reason: string;
    estimatedResponseTime: string;
    observations?: string;
    file?: File; // Raw file object
  }) => {
    setIsLoadingTickets(true); // Indicate loading for any ticket operation
    let fileDetails: TicketFile | undefined = undefined;
    let filePathInStorage: string | undefined = undefined;

    try {
      if (ticketData.file) {
        const file = ticketData.file;
        filePathInStorage = `public/${crypto.randomUUID()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from(TICKET_FILES_BUCKET)
          .upload(filePathInStorage, file);

        if (uploadError) {
          throw new Error(`Falha no upload do arquivo: ${uploadError.message}`);
        }
        
        fileDetails = {
          name: file.name,
          type: file.type,
          size: file.size,
          path: filePathInStorage,
        };
      }

      const newTicketPayload: Omit<Ticket, 'id' | 'submissionDate' | 'status'> & { file_name?: string, file_type?: string, file_size?: number, file_path?: string, user_id?: string } = {
        name: ticketData.name,
        phone: ticketData.phone,
        reason: ticketData.reason,
        estimatedResponseTime: ticketData.estimatedResponseTime,
        observations: ticketData.observations,
        file_name: fileDetails?.name,
        file_type: fileDetails?.type,
        file_size: fileDetails?.size,
        file_path: fileDetails?.path,
        user_id: user?.id,
      };

      const { data, error } = await supabase
        .from('tickets')
        .insert([newTicketPayload])
        .select()
        .single();

      if (error) throw error;

      await fetchTickets(); // Refetch to update the list
      toast({ title: "Ticket Criado", description: "Seu ticket foi registrado com sucesso." });

    } catch (error: any) {
      let detailedMessage = error.message || "Ocorreu um erro desconhecido.";
      if (error.details) detailedMessage += ` Detalhes: ${error.details}`;
      if (error.hint) detailedMessage += ` Dica: ${error.hint}`;
      toast({ title: "Erro ao Criar Ticket", description: detailedMessage, variant: "destructive" });
      console.error("Error adding ticket:", error);
      if (filePathInStorage) {
        console.warn("Orphaned file may exist in storage due to error:", filePathInStorage);
      }
    } finally {
      // setIsLoadingTickets(false); // fetchTickets will handle this
    }
  };

  const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;
      await fetchTickets();
      toast({ title: "Status Atualizado", description: `Status do ticket alterado para ${status}.` });
    } catch (error: any) {
      toast({ title: "Erro ao Atualizar Status", description: error.message || "Erro desconhecido.", variant: "destructive" });
    }
  };

  const updateTicketResponsible = async (ticketId: string, responsible: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ responsible })
        .eq('id', ticketId);

      if (error) throw error;
      await fetchTickets();
      toast({ title: "Responsável Atualizado", description: `Responsável pelo ticket alterado para ${responsible}.` });
    } catch (error: any) {
      toast({ title: "Erro ao Atualizar Responsável", description: error.message || "Erro desconhecido.", variant: "destructive" });
    }
  };
  
  const getTicketById = (ticketId: string): Ticket | undefined => {
    return tickets.find(ticket => ticket.id === ticketId);
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(TICKET_FILES_BUCKET)
        .download(filePath);

      if (error) throw error;
      if (data) {
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "Download Iniciado", description: `Baixando ${fileName}...` });
      }
    } catch (error: any) {
        toast({ title: "Erro no Download", description: `Não foi possível baixar o arquivo: ${error.message || "Erro desconhecido."}`, variant: "destructive" });
        console.error("Error downloading file:", error);
    }
  };


  return (
    <TicketContext.Provider value={{ tickets, isLoadingTickets, addTicket, updateTicketStatus, updateTicketResponsible, getTicketById, fetchTickets, downloadFile }}>
      {children}
    </TicketContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
}
