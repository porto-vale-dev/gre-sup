
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './AuthContext';
import type { PosContemplacaoTicket, CreatePosContemplacaoTicket, PosContemplacaoTicketStatus } from '@/types';

const POS_CONTEMPLACAO_FILES_BUCKET = 'pos-contemplacao-files';
const PAGE_SIZE = 1000;

interface PosContemplacaoTicketContextType {
  tickets: PosContemplacaoTicket[];
  isLoading: boolean;
  error: string | null;
  addTicket: (ticketData: CreatePosContemplacaoTicket, files?: File[]) => Promise<boolean>;
  updateTicket: (ticketId: string, updates: Partial<PosContemplacaoTicket>) => Promise<void>;
  getTicketById: (ticketId: string) => PosContemplacaoTicket | undefined;
  fetchTickets: () => void;
  downloadFile: (filePath: string, fileName: string) => Promise<void>;
  createPreviewUrl: (filePath: string) => Promise<string | null>;
}

const PosContemplacaoTicketContext = createContext<PosContemplacaoTicketContextType | undefined>(undefined);

export function PosContemplacaoTicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<PosContemplacaoTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const fetchTickets = useCallback(async () => {
    if (!isAuthenticated) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        let allTickets: PosContemplacaoTicket[] = [];
        let page = 0;
        let hasMore = true;

        while(hasMore) {
            const { data, error: fetchError } = await supabase
                .from('tickets_poscontemplacao')
                .select('*')
                .order('created_at', { ascending: false })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (fetchError) {
                throw new Error(`Erro ao buscar tickets de pós-contemplação: ${fetchError.message}.`);
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
        const errorMessage = err.message || 'Ocorreu um erro desconhecido.';
        setError(errorMessage);
        console.error("Error fetching Pós-Contemplação tickets:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      fetchTickets();
    } else if (!isAuthLoading && !isAuthenticated) {
      setTickets([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, fetchTickets]);

  const addTicket = async (ticketData: CreatePosContemplacaoTicket, files?: File[]): Promise<boolean> => {
    setIsLoading(true);
    try {
        if (!user) throw new Error("Usuário não autenticado.");

        let filePath: string | null = null;
        let fileName: string | null = null;
        
        if (files && files.length > 0) {
            const folderPath = `public/${crypto.randomUUID()}`;
            const uploadedFileNames: string[] = [];
            
            for (const file of files) {
                const pathInBucket = `${folderPath}/${file.name}`;
                const { error: uploadError } = await supabase.storage
                    .from(POS_CONTEMPLACAO_FILES_BUCKET)
                    .upload(pathInBucket, file);
                
                if (uploadError) {
                    throw new Error(`Erro no upload do arquivo ${file.name}: ${uploadError.message}`);
                }
                uploadedFileNames.push(file.name);
            }
            
            filePath = folderPath;
            fileName = JSON.stringify(uploadedFileNames);
        }

        const { files: _, ...restOfTicketData } = ticketData;

        const payload = {
            ...restOfTicketData,
            status: 'Aberto' as PosContemplacaoTicketStatus,
            file_path: filePath,
            file_name: fileName,
        };

        const { error: insertError } = await supabase
            .from('tickets_poscontemplacao')
            .insert(payload);

        if (insertError) {
            throw new Error(`Erro ao salvar ticket: ${insertError.message}`);
        }

        toast({ title: "Ticket de Pós-Contemplação Criado", description: "Sua solicitação foi registrada com sucesso." });
        await fetchTickets();
        return true;
        
    } catch (err: any) {
        toast({ title: "Erro ao Criar Ticket", description: err.message, variant: "destructive" });
        console.error("Error adding pós-contemplação ticket:", err);
        return false;
    } finally {
        setIsLoading(false);
    }
  };

  const updateTicket = async (ticketId: string, updates: Partial<PosContemplacaoTicket>) => {
    const { error } = await supabase
      .from('tickets_poscontemplacao')
      .update(updates)
      .eq('id', ticketId);

    if (error) {
      toast({ title: "Erro ao Atualizar", description: `Não foi possível atualizar o ticket. Detalhes: ${error.message}`, variant: "destructive" });
      return;
    }

    if (updates.status) {
        toast({ title: "Status Atualizado!", description: `O status do ticket foi alterado para ${updates.status}.` });
    } else {
        toast({ title: "Ticket Atualizado!", description: `As informações do ticket foram salvas.` });
    }
    
    await fetchTickets();
  };

  const getTicketById = (ticketId: string): PosContemplacaoTicket | undefined => {
    return tickets.find(ticket => ticket.id === ticketId);
  };
  
  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from(POS_CONTEMPLACAO_FILES_BUCKET).download(filePath);
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
        .from(POS_CONTEMPLACAO_FILES_BUCKET)
        .createSignedUrl(filePath, 300); // 5 minute link

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
    <PosContemplacaoTicketContext.Provider value={{ 
        tickets, 
        isLoading, 
        error, 
        addTicket, 
        updateTicket,
        getTicketById,
        fetchTickets,
        downloadFile,
        createPreviewUrl
    }}>
      {children}
    </PosContemplacaoTicketContext.Provider>
  );
}

export function usePosContemplacaoTickets() {
  const context = useContext(PosContemplacaoTicketContext);
  if (context === undefined) {
    throw new Error('usePosContemplacaoTickets must be used within a PosContemplacaoTicketProvider');
  }
  return context;
}
