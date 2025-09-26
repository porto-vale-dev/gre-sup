
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './AuthContext';
import type { PosContemplacaoTicket, CreatePosContemplacaoTicket, PosContemplacaoTicketStatus } from '@/types';
import { RESPONSAVEIS } from '@/lib/posContemplacaoData';

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
  const { user, username, isAuthenticated, isLoading: isAuthLoading } = useAuth();

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
        if (!user || !user.email) throw new Error("Usuário não autenticado ou sem e-mail.");

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
            relator: user.email, // Save user's email as the relator
            status: 'Aberto' as PosContemplacaoTicketStatus,
            file_path: filePath,
            file_name: fileName,
            data_limite: ticketData.data_limite,
            susep: ticketData.susep,
        };

        const { data: newTicketData, error: insertError } = await supabase
            .from('tickets_poscontemplacao')
            .insert(payload)
            .select()
            .single();

        if (insertError) {
            throw new Error(`Erro ao salvar ticket: ${insertError.message}`);
        }
        
        if (newTicketData) {
            const responsavelData = RESPONSAVEIS.find(r => r.email === newTicketData.responsavel);
            const responsavelNome = responsavelData?.name || newTicketData.responsavel;
            const responsavelCelular = responsavelData?.celular || null;

            const webhookUrl = "https://n8n.portovaleconsorcio.com.br/webhook/poscontemplacao";
            fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo_evento: 'novo_ticket',
                    motivo: newTicketData.motivo,
                    relator: username || user.email.split('@')[0],
                    protocolo: String(newTicketData.protocolo).padStart(4, '0'),
                    responsavel: responsavelNome,
                    celular_responsavel: responsavelCelular,
                    cliente: newTicketData.nome_cliente,
                }),
            }).catch(webhookError => {
                console.error("Webhook para N8N (Pós-Contemplação) falhou:", webhookError);
                toast({
                    title: "Aviso de Webhook",
                    description: "O ticket foi criado, mas a notificação pode não ter sido enviada.",
                    variant: "default",
                });
            });
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
    if (Object.keys(updates).length === 0) {
        toast({ title: "Nenhuma Alteração", description: "Nenhuma informação foi alterada.", variant: "default" });
        return;
    }

    const { data: currentTicket, error: fetchError } = await supabase
      .from('tickets_poscontemplacao')
      .select('*')
      .eq('id', ticketId)
      .single();

    if(fetchError){
      toast({ title: "Erro", description: "Não foi possível encontrar o ticket para atualizar.", variant: "destructive" });
      return;
    }

    const { error: updateError } = await supabase
      .from('tickets_poscontemplacao')
      .update(updates)
      .eq('id', ticketId);

    if (updateError) {
      toast({ title: "Erro ao Atualizar", description: `Não foi possível atualizar o ticket. Detalhes: ${updateError.message}`, variant: "destructive" });
      return;
    }
    
    toast({ title: "Ticket Atualizado!", description: `As informações do ticket foram salvas.` });

    if (updates.status && updates.status !== currentTicket.status) {
        if (updates.status === 'Retorno' || updates.status === 'Concluído') {
            const relatorData = RESPONSAVEIS.find(r => r.email === currentTicket.relator);
            const relatorNome = relatorData?.name || currentTicket.relator.split('@')[0];
            const relatorCelular = relatorData?.celular || null;

            const webhookUrl = "https://n8n.portovaleconsorcio.com.br/webhook/poscontemplacao";
            fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo_evento: updates.status === 'Retorno' ? 'retorno' : 'concluido',
                    protocolo: String(currentTicket.protocolo).padStart(4, '0'),
                    motivo: currentTicket.motivo,
                    relator: relatorNome,
                    celular_relator: relatorCelular,
                    cliente: currentTicket.nome_cliente,
                }),
            }).catch(webhookError => {
                console.error("Webhook de atualização de status (Pós-Contemplação) falhou:", webhookError);
                toast({
                    title: "Aviso de Webhook",
                    description: `O status foi atualizado, mas a notificação para "${updates.status}" pode não ter sido enviada.`,
                    variant: "default",
                });
            });
        }
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