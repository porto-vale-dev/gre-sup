
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Ticket, TicketStatus, SolutionFile } from '@/types';
import { supabase } from '@/lib/supabaseClient';
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
    files?: File[];
  }) => Promise<boolean>; // Return boolean for success
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
  const { user, isAuthenticated, isLoading: authIsLoading } = useAuth();

  const fetchTickets = useCallback(async () => {
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
  }, [toast]);

  useEffect(() => {
    // Only fetch tickets if auth has loaded and user is authenticated.
    if (!authIsLoading && isAuthenticated) {
      fetchTickets();
    } else if (!authIsLoading && !isAuthenticated) {
      // If not authenticated and auth has loaded, clear tickets and stop loading.
      setTickets([]);
      setIsLoadingTickets(false);
    }
  }, [isAuthenticated, authIsLoading, fetchTickets]);


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
    files?: File[];
  }): Promise<boolean> => {
    
    let filePath: string | null = null;
    let fileName: string | null = null;
    const submissionDate = new Date().toISOString();

    try {
      let assignedResponsible: string | null = null;

      const { data: agents, error: agentsError } = await supabase
        .from('profiles')
        .select('username')
        .in('cargo', ['gre'])

      if (agentsError) {
        throw new Error(`Não foi possível buscar os atendentes: ${agentsError.message}`);
      }

      if (agents && agents.length > 0) {
        const agentNames = agents.map(a => a.username as string).sort();

        const { data: lastTicket, error: lastTicketError } = await supabase
          .from('tickets')
          .select('responsible')
          .not('responsible', 'is', null) 
          .order('submission_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastTicketError) {
          console.warn(`Aviso ao buscar último ticket: ${lastTicketError.message}`);
        }

        const lastResponsible = lastTicket?.responsible;
        let nextAgentIndex = 0;

        if (lastResponsible) {
          const lastAgentIndex = agentNames.indexOf(lastResponsible);
          if (lastAgentIndex !== -1) {
            nextAgentIndex = (lastAgentIndex + 1) % agentNames.length;
          }
        }
        
        assignedResponsible = agentNames[nextAgentIndex];
      } else {
        console.warn("Nenhum atendente (cargo 'gre') encontrado para atribuição automática.");
      }

      if (ticketData.files && ticketData.files.length > 0) {
        const folderPath = `public/${crypto.randomUUID()}`;
        const uploadedFileNames: string[] = [];
        
        for (const file of ticketData.files) {
          const pathInBucket = `${folderPath}/${file.name}`;
          const { error: uploadError } = await supabase.storage
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

      const newTicketBasePayload = {
        name: ticketData.name,
        phone: ticketData.phone,
        client_name: ticketData.client_name,
        cpf: ticketData.cpf,
        grupo: ticketData.grupo,
        cota: ticketData.cota,
        reason: ticketData.reason,
        estimated_response_time: ticketData.estimated_response_time,
        observations: ticketData.observations,
        submission_date: submissionDate,
        status: "Novo" as TicketStatus,
        file_path: filePath,
        file_name: fileName,
        solution: null,
        solution_files: null,
        responsible: assignedResponsible,
      };

      const newTicketPayload = user
        ? { ...newTicketBasePayload, user_id: user.id }
        : newTicketBasePayload;

      const { data: insertedTicket, error: insertError } = await supabase
        .from('tickets')
        .insert(newTicketPayload)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Erro ao salvar ticket: ${insertError.message}`);
      }
      
      const webhookUrl = "https://n8n.portovaleconsorcio.com.br/webhook/34817f2f-1b3f-4432-a139-e159248dd070";
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            protocolo: insertedTicket.protocol,
            solicitante: insertedTicket.name,
            cliente: insertedTicket.client_name,
            motivo: insertedTicket.reason,
            responsavel: insertedTicket.responsible,
            telefone: insertedTicket.phone,
            previsao_resposta: insertedTicket.estimated_response_time
        }),
      }).catch(webhookError => {
        console.error("Webhook failed to send:", webhookError);
      });

      toast({ title: `Ticket #${String(insertedTicket.protocol).padStart(4, '0')} Criado`, description: "Seu ticket foi registrado com sucesso." });
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
