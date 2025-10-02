
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Ticket, TicketStatus, SolutionFile, ReasonAssignment, TicketReasonConfig } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { supabaseAnon } from '@/lib/supabaseAnonClient';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './AuthContext';
import { MAX_SOLUTION_FILE_SIZE, TICKET_REASONS } from '@/lib/constants';

const TICKET_FILES_BUCKET = 'ticket-files';
const PAGE_SIZE = 1000;

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
    copy_email?: string;
    files?: File[];
  }) => Promise<boolean>;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => Promise<void>;
  updateTicketResponsible: (ticketId: string, responsible: string) => Promise<void>;
  updateTicketSolution: (ticketId: string, solution: string, newFiles: File[], comentarios?: string) => Promise<boolean>;
  updateAndCompleteTicket: (ticketId: string, solution: string, newFiles: File[], comentarios?: string) => Promise<boolean>;
  deleteTicket: (ticketId: string, filePaths?: { solution_files?: SolutionFile[] | null, file_path?: string | null, file_name?: string | null }) => Promise<void>;
  getTicketById: (ticketId: string) => Ticket | undefined;
  fetchTickets: () => void;
  downloadFile: (filePath: string, fileName: string) => Promise<void>;
  createPreviewUrl: (filePath: string) => Promise<string | null>;
  markTicketAsViewed: (ticketId: string) => Promise<void>;
  
  fetchReasonAssignments: () => Promise<ReasonAssignment[]>;
  updateReasonAssignment: (reason: string, usernames: string[]) => Promise<boolean>;
  fetchTicketReasons: () => Promise<TicketReasonConfig[]>;
  updateTicketReasonStatus: (reasonValue: string, isActive: boolean) => Promise<boolean>;
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
        let allTickets: Ticket[] = [];
        let page = 0;
        let hasMore = true;

        while(hasMore) {
            const { data, error: fetchError } = await supabase
                .from('tickets')
                .select('*')
                .order('submission_date', { ascending: false })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (fetchError) {
                throw new Error(`Erro ao buscar tickets de suporte: ${fetchError.message}`);
            }

            if (data) {
                allTickets = allTickets.concat(data);
            }

            if (!data || data.length < PAGE_SIZE) {
                hasMore = false;
            } else {
                page++;
            }
        }
        
        setTickets(allTickets);

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
    copy_email?: string;
    files?: File[];
  }): Promise<boolean> => {
    try {
      let filePath: string | null = null;
      let fileName: string | null = null;
      const submissionDate = new Date().toISOString();
      // Always use the anonymous client for this public function call
      const dbClient = supabaseAnon;

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
      
      const copyEmail = ticketData.copy_email ? ticketData.copy_email : null;

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
  
  const updateTicketSolution = async (ticketId: string, solution: string, newFiles: File[], comentarios?: string): Promise<boolean> => {
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
        .update({ 
          solution: solution, 
          solution_files: updatedSolutionFiles,
          comentarios: comentarios,
        })
        .eq('id', ticketId);

      if (updateError) {
        throw new Error(`Erro ao salvar a solução: ${updateError.message}`);
      }

      toast({ title: "Solução Salva", description: "As informações da solução foram salvas com sucesso." });
      await fetchTickets();
      return true;

    } catch (error: any) {
      toast({ title: "Erro ao Salvar Solução", description: error.message, variant: "destructive" });
      console.error("Error updating ticket solution:", error);
      return false;
    }
  };

  const updateAndCompleteTicket = async (ticketId: string, solution: string, newFiles: File[], comentarios?: string): Promise<boolean> => {
    try {
        const solutionSaved = await updateTicketSolution(ticketId, solution, newFiles, comentarios);
        if (!solutionSaved) {
            // Error toast is already shown by updateTicketSolution
            return false;
        }

        const { error: statusError } = await supabase
            .from('tickets')
            .update({ status: 'Concluído' })
            .eq('id', ticketId);

        if (statusError) {
            throw new Error(`Erro ao atualizar o status: ${statusError.message}`);
        }

        toast({ title: "Ticket Concluído", description: "O ticket foi salvo e marcado como concluído." });
        await fetchTickets();
        return true;
    } catch (error: any) {
        toast({ title: "Erro ao Concluir Ticket", description: error.message, variant: "destructive" });
        console.error("Error completing ticket:", error);
        return false;
    }
  };
  
  const deleteTicket = async (ticketId: string, filePaths?: { solution_files?: SolutionFile[] | null, file_path?: string | null, file_name?: string | null }) => {
    const originalTickets = tickets;
    // Optimistic update: remove the ticket from the UI immediately
    setTickets(prevTickets => prevTickets.filter(t => t.id !== ticketId));

    try {
      // 1. Delete associated files
      const pathsToDelete: string[] = [];
      if (filePaths?.solution_files) {
        pathsToDelete.push(...filePaths.solution_files.map(f => f.file_path));
      }
      if (filePaths?.file_path && filePaths?.file_name) {
          try {
            const originalFileNames = JSON.parse(filePaths.file_name);
            if(Array.isArray(originalFileNames)) {
              originalFileNames.forEach(name => pathsToDelete.push(`${filePaths.file_path}/${name}`));
            }
          } catch(e) {
            // Fallback for single file
            pathsToDelete.push(filePaths.file_path);
          }
      }

      if (pathsToDelete.length > 0) {
        const { error: removeError } = await supabase.storage
          .from(TICKET_FILES_BUCKET)
          .remove(pathsToDelete);
        
        if (removeError) {
          // Log error but don't block ticket deletion
          console.error(`Error deleting files for ticket ${ticketId}:`, removeError);
          toast({ title: "Erro ao Excluir Arquivos", description: "Não foi possível remover os anexos, mas a exclusão do ticket continuará.", variant: "destructive" });
        }
      }

      // 2. Call RPC to delete the ticket
      const { error: deleteError } = await supabase.rpc('delete_ticket_gre', {
        ticket_id_to_delete: ticketId
      });

      if (deleteError) {
        throw deleteError; // This will be caught by the catch block
      }
      
      toast({ title: "Ticket Excluído", description: "O ticket foi removido com sucesso." });
      // No need to fetchTickets here, UI is already updated.

    } catch (error: any) {
        // If an error occurs, revert the optimistic update
        setTickets(originalTickets);
        toast({ title: "Erro ao Excluir", description: `Não foi possível excluir o ticket: ${error.message}`, variant: "destructive" });
        console.error("Error deleting ticket:", error);
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

  const markTicketAsViewed = async (ticketId: string) => {
    const { error } = await supabase
      .from('tickets')
      .update({ visualizado: true })
      .eq('id', ticketId);

    if (error) {
      console.error('Error marking ticket as viewed:', error.message);
      toast({ title: 'Erro', description: 'Não foi possível marcar a notificação como lida.', variant: 'destructive'});
    } else {
      // Optimistically update the local state
      setTickets(prevTickets => 
        prevTickets.map(t => t.id === ticketId ? { ...t, visualizado: true } : t)
      );
    }
  };


  const fetchReasonAssignments = async (): Promise<ReasonAssignment[]> => {
    const { data, error } = await supabase
        .from('reason_assignments')
        .select('reason, username');
    
    if (error) {
        console.error('Error fetching reason assignments:', error);
        toast({ title: 'Erro ao buscar atribuições', description: error.message, variant: 'destructive' });
        return [];
    }
    return data || [];
  };

  const updateReasonAssignment = async (reason: string, usernames: string[]): Promise<boolean> => {
      // First, delete all existing assignments for this reason.
      const { error: deleteError } = await supabase
          .from('reason_assignments')
          .delete()
          .eq('reason', reason);

      if (deleteError) {
          console.error('Error deleting previous assignments:', deleteError);
          toast({ title: 'Erro ao atualizar atribuição', description: `Não foi possível remover as regras antigas. Erro: ${deleteError.message}`, variant: 'destructive' });
          return false;
      }

      // If new usernames are provided, insert the new assignments.
      if (usernames.length > 0) {
          const newAssignments = usernames.map(username => ({ reason, username }));
          const { error: insertError } = await supabase
              .from('reason_assignments')
              .insert(newAssignments);

          if (insertError) {
              console.error('Error inserting new assignments:', insertError);
              toast({ title: 'Erro ao salvar atribuição', description: `Não foi possível criar as novas regras. Erro: ${insertError.message}`, variant: 'destructive' });
              return false;
          }
      }

      toast({ title: 'Atribuições atualizadas com sucesso!' });
      return true;
  };
  
  const fetchTicketReasons = async (): Promise<TicketReasonConfig[]> => {
    const { data, error } = await supabase.from('ticket_reasons_config').select('*');

    if (error) {
      console.error('Error fetching reason configs:', error);
      // Fallback to local constants if there's an error
      return TICKET_REASONS;
    }
    
    // Combine DB results with local constants to ensure all reasons are present
    const combinedReasons = TICKET_REASONS.map(localReason => {
        const dbReason = data.find(d => d.value === localReason.value);
        return {
            ...localReason,
            is_active: dbReason ? dbReason.is_active : localReason.is_active,
        };
    });

    return combinedReasons;
  };
  
  const updateTicketReasonStatus = async (reasonValue: string, isActive: boolean): Promise<boolean> => {
    const { error } = await supabase
      .from('ticket_reasons_config')
      .upsert({ value: reasonValue, is_active: isActive }, { onConflict: 'value' });

    if (error) {
      console.error('Error updating reason status:', error);
      toast({ title: 'Erro ao atualizar status do motivo', description: error.message, variant: 'destructive' });
      return false;
    }

    toast({ title: 'Status do motivo atualizado!' });
    return true;
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
        updateAndCompleteTicket,
        deleteTicket,
        getTicketById, 
        fetchTickets, 
        downloadFile,
        createPreviewUrl,
        markTicketAsViewed,
        fetchReasonAssignments,
        updateReasonAssignment,
        fetchTicketReasons,
        updateTicketReasonStatus,
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
