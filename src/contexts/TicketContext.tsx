
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Ticket, TicketStatus, SolutionFile } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { supabaseAnon } from '@/lib/supabaseAnonClient';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './AuthContext';
import { MAX_SOLUTION_FILE_SIZE } from '@/lib/constants';

const TICKET_FILES_BUCKET = 'ticket-files';

interface TicketContextType {
  tickets: Ticket[];
  isLoadingTickets: boolean;
  error: string | null;
  addTicket: (ticketData: {
    name: string;
    phone: string;
    client_name: string;
    cpf: string;
    grupo: string;
    cota: string;
    reason: string;
    estimated_response_time: string;
    observations?: string;
    copy_email_prefix?: string;
    files?: File[];
  }) => Promise<boolean>;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => Promise<void>;
  updateTicketResponsible: (ticketId: string, responsible: string) => Promise<void>;
  updateTicketSolution: (ticketId: string, solution: string, newFiles: File[]) => Promise<void>;
  getTicketById: (ticketId: string) => Ticket | undefined;
  fetchTickets: () => void;
  downloadFile: (filePath: string, fileName: string) => Promise<void>;
  createPreviewUrl: (filePath: string) => Promise<string | null>;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  const fetchTickets = useCallback(async () => {
    if (!isAuthenticated) {
        setIsLoadingTickets(false);
        return;
    }
    setIsLoadingTickets(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('tickets')
        .select('*')
        .order('submission_date', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }
      setTickets(data || []);
    } catch (err: any) {
        const errorMessage = err.message || 'Ocorreu um erro desconhecido ao buscar os tickets.';
        setError(errorMessage);
        toast({ title: "Erro ao Carregar Tickets", description: errorMessage, variant: "destructive" });
        console.error("Error fetching tickets:", err);
    } finally {
      setIsLoadingTickets(false);
    }
  }, [toast, isAuthenticated]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchTickets();
    } else if (!isLoading && !isAuthenticated) {
      setTickets([]);
      setIsLoadingTickets(false);
    }
  }, [isAuthenticated, isLoading, fetchTickets]);


  const addTicket = async (ticketData: {
    name: string;
    phone: string;
    client_name: string;
    cpf: string;
    grupo: string;
    cota: string;
    reason: string;
    estimated_response_time: string;
    observations?: string;
    copy_email_prefix?: string;
    files?: File[];
  }): Promise<boolean> => {
    try {
      let filePath: string | null = null;
      let fileName: string | null = null;
      const submissionDate = new Date().toISOString();
      const dbClient = isAuthenticated ? supabase : supabaseAnon;

      if (ticketData.files && ticketData.files.length > 0) {
        const folderPath = `public/${crypto.randomUUID()}`;
        const uploadedFileNames: string[] = [];
        
        for (const file of ticketData.files) {
          const pathInBucket = `${folderPath}/${file.name}`;
          const { error: uploadError } = await dbClient.storage
            .from(TICKET_FILES_BUCKET)
            .upload(pathInBucket, file);
          
          if (uploadError) {
            throw new Error(`Erro no upload do arquivo ${file.name}: ${uploadError.message}`);
          }
          uploadedFileNames.push(file.name);
        }
        
        filePath = folderPath;
        fileName = JSON.stringify(uploadedFileNames);
      }
      
      const copyEmail = ticketData.copy_email_prefix ? `${ticketData.copy_email_prefix}@portovaleconsorcios.com.br` : null;

      const ticketPayload = {
        p_name: ticketData.name,
        p_phone: ticketData.phone,
        p_copy_email: copyEmail,
        p_client_name: ticketData.client_name,
        p_cpf: ticketData.cpf,
        p_grupo: ticketData.grupo,
        p_cota: ticketData.cota,
        p_reason: ticketData.reason,
        p_estimated_response_time: ticketData.estimated_response_time,
        p_observations: ticketData.observations,
        p_file_path: filePath,
        p_file_name: fileName,
        p_submission_date: submissionDate,
        p_user_id: user?.id ?? null,
      };

      const { data: newTicket, error: rpcError } = await dbClient
        .rpc('create_ticket_public', ticketPayload);
        
      if (rpcError) {
        throw new Error(`Erro ao salvar ticket: ${rpcError.message}`);
      }
      
      const webhookUrl = "https://n8n.portovaleconsorcio.com.br/webhook/34817f2f-1b3f-4432-a139-e159248dd070";
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            protocolo: newTicket.protocol,
            solicitante: newTicket.name,
            cliente: newTicket.client_name,
            motivo: newTicket.reason,
            responsavel: newTicket.responsible || 'Não atribuído',
            telefone: newTicket.phone,
            previsao_resposta: newTicket.estimated_response_time
        }),
      }).catch(webhookError => {
        console.error("Webhook failed to send:", webhookError);
      });

      toast({ title: `Ticket #${String(newTicket.protocol).padStart(4, '0')} Criado`, description: "Seu ticket foi registrado com sucesso." });
      if(isAuthenticated) await fetchTickets();
      return true;

    } catch (error: any) {
      toast({ title: "Erro ao Criar Ticket", description: error.message, variant: "destructive" });
      console.error("Error adding ticket:", error);
      return false;
    }
  };

  const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    const { error } = await supabase
      .from('tickets')
      .update({ status })
      .eq('id', ticketId);

    if (error) {
      toast({ title: "Erro ao Atualizar", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Status Atualizado", description: `Status do ticket alterado para ${status}.` });
    
    await fetchTickets();
  };

  const updateTicketResponsible = async (ticketId: string, responsible: string) => {
    const { error } = await supabase
      .from('tickets')
      .update({ responsible })
      .eq('id', ticketId);

    if (error) {
      toast({ title: "Erro ao Atualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Responsável Atualizado", description: `Responsável pelo ticket alterado para ${responsible}.` });
      await fetchTickets();
    }
  };
  
  const updateTicketSolution = async (ticketId: string, solution: string, newFiles: File[]) => {
    try {
      const currentTicket = getTicketById(ticketId);
      if (!currentTicket) throw new Error("Ticket não encontrado.");

      let uploadedFiles: SolutionFile[] = [];

      for (const file of newFiles) {
        if (file.size > MAX_SOLUTION_FILE_SIZE) {
          throw new Error(`O arquivo ${file.name} excede o limite de 100MB.`);
        }
        const fileName = file.name; 
        const sanitizedFileName = fileName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
        const newFileNameForPath = `${crypto.randomUUID()}-${sanitizedFileName}`;
        const filePath = `solutions/${ticketId}/${newFileNameForPath}`;

        const { error: uploadError } = await supabase.storage
          .from(TICKET_FILES_BUCKET)
          .upload(filePath, file);
        
        if (uploadError) {
          throw new Error(`Erro no upload do arquivo ${fileName}: ${uploadError.message}`);
        }

        uploadedFiles.push({ file_path: filePath, file_name: fileName });
      }

      const existingFiles = currentTicket.solution_files || [];
      const updatedSolutionFiles = [...existingFiles, ...uploadedFiles];

      const { error: updateError } = await supabase
        .from('tickets')
        .update({ solution: solution, solution_files: updatedSolutionFiles })
        .eq('id', ticketId);

      if (updateError) {
        throw new Error(`Erro ao salvar a solução: ${updateError.message}`);
      }

      toast({ title: "Solução Salva", description: "As informações da solução foram salvas com sucesso." });
      await fetchTickets();

    } catch (error: any) {
      toast({ title: "Erro ao Salvar Solução", description: error.message, variant: "destructive" });
      console.error("Error updating ticket solution:", error);
      throw error;
    }
  };

  const getTicketById = (ticketId: string): Ticket | undefined => {
    return tickets.find(ticket => ticket.id === ticketId);
  };
  
  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from(TICKET_FILES_BUCKET).download(filePath);
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Download Iniciado", description: `Baixando ${fileName}...` });
    } catch (error: any) {
        toast({ title: "Erro no Download", description: `Não foi possível baixar o arquivo: ${error.message || "Erro desconhecido."}`, variant: "destructive" });
        console.error("Error downloading file:", error);
    }
  };

  const createPreviewUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from(TICKET_FILES_BUCKET)
        .createSignedUrl(filePath, 60);

      if (error) {
        throw error;
      }
      return data.signedUrl;
    } catch (error: any) {
      console.error("Error creating signed URL:", error);
      toast({
        title: "Erro ao Gerar Link",
        description: `Não foi possível criar o link de visualização: ${error.message}`,
        variant: "destructive",
      });
      return null;
    }
  };

  return (
    <TicketContext.Provider value={{ 
        tickets, 
        isLoadingTickets,
        error, 
        addTicket, 
        updateTicketStatus, 
        updateTicketResponsible,
        updateTicketSolution, 
        getTicketById, 
        fetchTickets, 
        downloadFile,
        createPreviewUrl
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

    