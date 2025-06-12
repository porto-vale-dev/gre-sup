
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
  const { user } = useAuth(); // Get the authenticated user

  const fetchTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('submissionDate', { ascending: false }); // Supabase uses 'created_at' by default if you used the DDL

      if (error) throw error;

      const formattedTickets = data.map(ticket => ({
        ...ticket,
        submissionDate: ticket.submissionDate || ticket.created_at, // Use submissionDate or created_at
        file: ticket.file_path ? {
          name: ticket.file_name,
          type: ticket.file_type,
          size: ticket.file_size,
          path: ticket.file_path,
        } : undefined,
      })) as Ticket[];
      setTickets(formattedTickets);

    } catch (error: any) {
      toast({ title: "Erro ao Carregar Tickets", description: error.message, variant: "destructive" });
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoadingTickets(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const addTicket = async (ticketData: {
    name: string;
    phone: string;
    reason: string;
    estimatedResponseTime: string;
    observations?: string;
    file?: File; // Raw file object
  }) => {
    setIsLoadingTickets(true);
    let fileDetails: TicketFile | undefined = undefined;
    let filePathInStorage: string | undefined = undefined;

    try {
      // Handle file upload if present
      if (ticketData.file) {
        const file = ticketData.file;
        // Create a unique path for the file in Supabase Storage
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
          path: filePathInStorage, // Store the path
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
        // status: 'Novo', // Handled by DB default or RLS
        // submissionDate: new Date().toISOString(), // Handled by DB default
        user_id: user?.id, // Optional: associate with the logged-in user
      };

      const { data, error } = await supabase
        .from('tickets')
        .insert([newTicketPayload])
        .select()
        .single();

      if (error) throw error;

      // Refetch tickets to update the list including the new one
      await fetchTickets();
      toast({ title: "Ticket Criado", description: "Seu ticket foi registrado com sucesso." });

    } catch (error: any) {
      toast({ title: "Erro ao Criar Ticket", description: error.message, variant: "destructive" });
      console.error("Error adding ticket:", error);
      // If file upload succeeded but DB insert failed, consider deleting the orphaned file
      if (filePathInStorage) {
        // supabase.storage.from(TICKET_FILES_BUCKET).remove([filePathInStorage]);
        // For now, we'll log it. Robust error handling would remove it.
        console.warn("Orphaned file may exist in storage:", filePathInStorage);
      }
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;
      await fetchTickets(); // Refetch to reflect changes
      toast({ title: "Status Atualizado", description: `Status do ticket alterado para ${status}.` });
    } catch (error: any) {
      toast({ title: "Erro ao Atualizar Status", description: error.message, variant: "destructive" });
    }
  };

  const updateTicketResponsible = async (ticketId: string, responsible: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ responsible })
        .eq('id', ticketId);

      if (error) throw error;
      await fetchTickets(); // Refetch to reflect changes
      toast({ title: "Responsável Atualizado", description: `Responsável pelo ticket alterado para ${responsible}.` });
    } catch (error: any) {
      toast({ title: "Erro ao Atualizar Responsável", description: error.message, variant: "destructive" });
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
        toast({ title: "Erro no Download", description: `Não foi possível baixar o arquivo: ${error.message}`, variant: "destructive" });
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
