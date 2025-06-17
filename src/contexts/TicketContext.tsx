
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
    if (authIsLoading) { // Wait for authentication to be resolved
      // console.log("Auth is loading, delaying fetchTickets");
      return;
    }
    // console.log("Auth resolved, isAuthenticated:", isAuthenticated, "Proceeding with fetchTickets");


    setIsLoadingTickets(true);
    try {
      const { data, error: queryError } = await supabase
        .from('tickets')
        .select('*')
        .order('submissionDate', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      if (!data) {
        throw new Error("Dados não recebidos do Supabase, mas nenhum erro explícito foi reportado.");
      }

      const formattedTickets = data.map(ticket => ({
        ...ticket,
        submissionDate: ticket.submissionDate || ticket.created_at, // Supabase uses created_at by default
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
      // Keep a reference to the original error for detailed logging
      const originalError = errorCaught;

      if (errorCaught && typeof errorCaught.message === 'string' && errorCaught.message.trim() !== '') {
        errorMessage = errorCaught.message;
        if (errorCaught.details) errorMessage += ` Detalhes: ${errorCaught.details}`;
        if (errorCaught.hint) errorMessage += ` Dica: ${errorCaught.hint}`;
      } else if (typeof errorCaught === 'string' && errorCaught.trim() !== '') {
        errorMessage = errorCaught;
      } else if (errorCaught) {
        // Try to stringify the error if it's an object but not an error with a message
        try {
          const errorString = JSON.stringify(errorCaught);
          if (errorString !== '{}') { // Avoid showing "{}" if stringify results in an empty object
            errorMessage = `Detalhes do erro: ${errorString}`;
          } else if (errorCaught.toString && typeof errorCaught.toString === 'function') {
            // Fallback to toString if JSON.stringify is not helpful
            const objStr = errorCaught.toString();
            if (objStr !== '[object Object]') { // Avoid showing "[object Object]"
                errorMessage = `Erro: ${objStr}`;
            }
          }
        } catch (e_stringify) {
          // If stringify or toString fails, stick with the generic unknown error message
        }
      }
      
      toast({ 
        title: "Erro ao Carregar Tickets", 
        description: errorMessage, 
        variant: "destructive" 
      });

      // Enhanced console logging
      console.error("fetchTickets caught an error. Raw error object:", originalError);
      
      let stringifiedError;
      try {
        stringifiedError = JSON.stringify(originalError, Object.getOwnPropertyNames(originalError), 2);
      } catch (e) {
        stringifiedError = "Could not stringify the error object.";
      }
      
      console.error("Detailed error information for fetchTickets:", {
        message: String(originalError?.message || 'N/A (No message property)'),
        details: String(originalError?.details || 'N/A (No details property)'),
        hint: String(originalError?.hint || 'N/A (No hint property)'),
        code: String(originalError?.code || 'N/A (No code property)'),
        raw_error_stringified: stringifiedError,
        // You can also log the raw object again if the structured one is not enough for the overlay
        // fullErrorObject_direct: originalError 
      });
    } finally {
      setIsLoadingTickets(false);
    }
  }, [toast, authIsLoading, isAuthenticated]); // Ensure all dependencies are listed

  useEffect(() => {
    if (!authIsLoading) { // Only call fetchTickets if auth is not loading
      fetchTickets();
    }
  }, [fetchTickets, authIsLoading]);


  const addTicket = async (ticketData: {
    name: string;
    phone: string;
    reason: string;
    estimatedResponseTime: string;
    observations?: string;
    file?: File;
  }) => {
    setIsLoadingTickets(true);
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
        user_id: user?.id, // Associate ticket with the logged-in user
      };

      const { data, error } = await supabase
        .from('tickets')
        .insert([newTicketPayload])
        .select()
        .single(); // Use .single() if you expect one row back, good for insert returning the new row

      if (error) throw error;

      // Instead of just setting new ticket, refetch all to keep list consistent
      await fetchTickets(); // This will re-fetch and update the tickets list including the new one
      toast({ title: "Ticket Criado", description: "Seu ticket foi registrado com sucesso." });

    } catch (error: any) {
      let detailedMessage = error.message || "Ocorreu um erro desconhecido.";
      if (error.details) detailedMessage += ` Detalhes: ${error.details}`;
      if (error.hint) detailedMessage += ` Dica: ${error.hint}`;
      toast({ title: "Erro ao Criar Ticket", description: detailedMessage, variant: "destructive" });
      console.error("Error adding ticket:", error);
      // Potentially handle file cleanup if DB insert fails after file upload
      if (filePathInStorage) {
        // Consider deleting the orphaned file from storage if the ticket creation failed
        console.warn("Orphaned file may exist in storage due to error:", filePathInStorage);
        // await supabase.storage.from(TICKET_FILES_BUCKET).remove([filePathInStorage]); // Uncomment if you want to auto-delete
      }
    } /* finally { // setIsLoadingTickets(false); // isLoading is handled by fetchTickets } */
  };

  const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;
      // Update local state immediately for responsiveness or refetch
      // setTickets(prevTickets => prevTickets.map(t => t.id === ticketId ? { ...t, status } : t));
      await fetchTickets(); // Refetch to ensure data consistency
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
      // setTickets(prevTickets => prevTickets.map(t => t.id === ticketId ? { ...t, responsible } : t));
      await fetchTickets(); // Refetch for consistency
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
        link.download = fileName; // Use the original file name for download
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
