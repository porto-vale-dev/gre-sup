
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
      return;
    }

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
      const originalError = errorCaught; // Keep a reference

      // Attempt to extract a meaningful message
      if (originalError && typeof originalError.message === 'string' && originalError.message.trim() !== '') {
        errorMessage = originalError.message;
        if (originalError.details) errorMessage += ` Detalhes: ${originalError.details}`;
        if (originalError.hint) errorMessage += ` Dica: ${originalError.hint}`;
      } else if (typeof originalError === 'string' && originalError.trim() !== '') {
        errorMessage = originalError;
      } else if (originalError) {
        try {
          const errorString = JSON.stringify(originalError);
          if (errorString !== '{}') {
            errorMessage = `Detalhes do erro: ${errorString}`;
          } else if (originalError.toString && typeof originalError.toString === 'function') {
            const objStr = originalError.toString();
            if (objStr !== '[object Object]') {
                errorMessage = `Erro: ${objStr}`;
            }
          }
        } catch (e_stringify) {
          // Stick with the generic message
        }
      }
      
      toast({ 
        title: "Erro ao Carregar Tickets", 
        description: errorMessage, 
        variant: "destructive" 
      });

      // Enhanced console logging
      console.error("Raw error object during fetchTickets:", originalError);
      
      let stringifiedErrorForOverlay;
      try {
        stringifiedErrorForOverlay = JSON.stringify(originalError, Object.getOwnPropertyNames(originalError));
      } catch (e) {
        stringifiedErrorForOverlay = "Não foi possível stringificar o objeto de erro para o overlay.";
      }

      console.error("Detailed error information during fetchTickets:", {
        message: String(originalError?.message || 'N/A (Sem propriedade message)'),
        details: String(originalError?.details || 'N/A (Sem propriedade details)'),
        hint: String(originalError?.hint || 'N/A (Sem propriedade hint)'),
        code: String(originalError?.code || 'N/A (Sem propriedade code)'),
        raw_error_stringified_for_overlay: stringifiedErrorForOverlay,
        fullErrorObject_direct_log: originalError 
      });

    } finally {
      setIsLoadingTickets(false);
    }
  }, [toast, authIsLoading, isAuthenticated]);

  useEffect(() => {
    if (!authIsLoading) {
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
        user_id: user?.id, 
      };

      const { data, error } = await supabase
        .from('tickets')
        .insert([newTicketPayload])
        .select()
        .single(); 

      if (error) throw error;

      await fetchTickets(); 
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
