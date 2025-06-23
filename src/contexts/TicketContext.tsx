
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState } from 'react';
import type { Ticket, TicketStatus, TicketFile } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './AuthContext';

// Helper function to read a file as a Base64 data URL
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};


interface TicketContextType {
  tickets: Ticket[];
  isLoadingTickets: boolean;
  error: string | null;
  addTicket: (ticketData: {
    name: string;
    phone: string;
    reason: string;
    estimatedResponseTime: string;
    observations?: string;
    file?: File;
  }) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  updateTicketResponsible: (ticketId: string, responsible: string) => void;
  getTicketById: (ticketId: string) => Ticket | undefined;
  fetchTickets: () => void; // Kept for component compatibility, but is a no-op
  downloadFile: (fileContent: string, fileName: string) => void;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useLocalStorage<Ticket[]>('tickets', []);
  const { toast } = useToast();
  const { user } = useAuth();

  const addTicket = async (ticketData: {
    name: string;
    phone: string;
    reason: string;
    estimatedResponseTime: string;
    observations?: string;
    file?: File;
  }) => {
    try {
      let fileDetails: TicketFile | undefined = undefined;
      if (ticketData.file) {
        const fileContent = await readFileAsDataURL(ticketData.file);
        fileDetails = {
          name: ticketData.file.name,
          type: ticketData.file.type,
          size: ticketData.file.size,
          content: fileContent,
        };
      }

      const newTicket: Ticket = {
        id: crypto.randomUUID(),
        name: ticketData.name,
        phone: ticketData.phone,
        reason: ticketData.reason,
        estimatedResponseTime: ticketData.estimatedResponseTime,
        observations: ticketData.observations,
        file: fileDetails,
        submissionDate: new Date().toISOString(),
        status: "Novo",
        user_id: user || undefined,
      };

      setTickets(prevTickets => [newTicket, ...prevTickets]);
      toast({ title: "Ticket Criado", description: "Seu ticket foi registrado com sucesso." });

    } catch (error: any) {
      toast({ title: "Erro ao Criar Ticket", description: error.message || "Ocorreu um erro ao processar o arquivo.", variant: "destructive" });
      console.error("Error adding ticket:", error);
    }
  };

  const updateTicketStatus = (ticketId: string, status: TicketStatus) => {
    setTickets(prevTickets =>
      prevTickets.map(t =>
        t.id === ticketId ? { ...t, status } : t
      )
    );
    toast({ title: "Status Atualizado", description: `Status do ticket alterado para ${status}.` });
  };

  const updateTicketResponsible = (ticketId: string, responsible: string) => {
    setTickets(prevTickets =>
      prevTickets.map(t =>
        t.id === ticketId ? { ...t, responsible } : t
      )
    );
    toast({ title: "Responsável Atualizado", description: `Responsável pelo ticket alterado para ${responsible}.` });
  };

  const getTicketById = (ticketId: string): Ticket | undefined => {
    return tickets.find(ticket => ticket.id === ticketId);
  };
  
  const fetchTickets = () => {
    // This function is a no-op in local storage mode, but is kept for compatibility
    // with components that might call it (e.g., on an error boundary).
  };

  const downloadFile = (fileContent: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = fileContent; // The content is a Base64 data URL
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Download Iniciado", description: `Baixando ${fileName}...` });
    } catch (error: any) {
        toast({ title: "Erro no Download", description: `Não foi possível baixar o arquivo: ${error.message || "Erro desconhecido."}`, variant: "destructive" });
        console.error("Error downloading file:", error);
    }
  };

  return (
    <TicketContext.Provider value={{ 
        tickets, 
        isLoadingTickets: false, // Always false in local storage mode
        error: null, // Always null in local storage mode
        addTicket, 
        updateTicketStatus, 
        updateTicketResponsible, 
        getTicketById, 
        fetchTickets, 
        downloadFile 
    }}>
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
