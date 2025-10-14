

"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { CobrancaTicket, CobrancaTicketStatus, CreateCobrancaTicket, RetornoComercialStatus, RetornoComercialComment, SolutionFile } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './AuthContext';
import { gerentesPorDiretor, diretores } from '@/lib/cobrancaData';
import { format } from 'date-fns';

const COBRANCA_FILES_BUCKET = 'cobranca-files';
const PAGE_SIZE = 1000;

interface CobrancaTicketContextType {
  tickets: CobrancaTicket[];
  isLoading: boolean;
  error: string | null;
  addTicket: (ticketData: CreateCobrancaTicket) => Promise<boolean>;
  updateTicket: (ticketId: string, updates: Partial<CobrancaTicket>) => Promise<void>;
  updateAndResolveTicket: (ticketId: string, details: Partial<CobrancaTicket>) => Promise<boolean>;
  updateTicketDetailsAndRetorno: (
    ticketId: string,
    details: Partial<CobrancaTicket>,
  ) => Promise<boolean>;
  saveUserResponse: (
    ticketId: string, 
    status: RetornoComercialStatus, 
    commentText: string,
    author: string,
    files: File[]
  ) => Promise<boolean>;
  deleteTicket: (ticketId: string, filePath?: string | null) => Promise<void>;
  getTicketById: (ticketId: string) => CobrancaTicket | undefined;
  fetchTickets: () => void;
  downloadFile: (filePath: string, fileName: string) => Promise<void>;
  createPreviewUrl: (filePath: string) => Promise<string | null>;
}

const CobrancaTicketContext = createContext<CobrancaTicketContextType | undefined>(undefined);

export function CobrancaTicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<CobrancaTicket[]>([]);
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
        let allTickets: CobrancaTicket[] = [];
        let page = 0;
        let hasMore = true;

        while(hasMore) {
            const { data, error: rpcError } = await supabase
                .from('tickets_cobranca')
                .select('*')
                .order('created_at', { ascending: false })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            
            if (rpcError) {
                throw new Error(`Erro ao buscar tickets de apoio: ${rpcError.message}. Verifique a tabela 'tickets_cobranca' no Supabase.`);
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
        toast({ title: "Erro ao Carregar Tickets de Apoio", description: errorMessage, variant: "destructive" });
        console.error("Error fetching cobranca tickets:", err);
    } finally {
      setIsLoading(false);
    }
  }, [toast, isAuthenticated]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      fetchTickets();
    } else if (!isAuthLoading && !isAuthenticated) {
      setTickets([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, fetchTickets]);


  const addTicket = async (ticketData: CreateCobrancaTicket): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (!user) throw new Error("Usuário não autenticado.");

      const diretorData = diretores.find(
        d => d.name.trim().toLowerCase() === ticketData.diretor.trim().toLowerCase()
      );
      const diretorEmail = diretorData?.email || null;

      const gerenteData = gerentesPorDiretor[ticketData.diretor]?.find(
        g => g.name.trim().toLowerCase() === ticketData.gerente.trim().toLowerCase()
      );
      
      if (!gerenteData) {
        throw new Error(`Gerente "${ticketData.gerente}" não encontrado ou não pertence ao diretor "${ticketData.diretor}". Verifique os dados em \`src/lib/cobrancaData.ts\``);
      }

      const gerenteEmail = gerenteData.email;
      const celularGerente = gerenteData.celular;

      let filePath: string | null = null;
      let fileName: string | null = null;
      
      if (ticketData.files && ticketData.files.length > 0) {
          const folderPath = `public/${crypto.randomUUID()}`;
          const uploadedFileNames: string[] = [];
          
          for (const file of ticketData.files) {
              const pathInBucket = `${folderPath}/${file.name}`;
              const { error: uploadError } = await supabase.storage
                  .from(COBRANCA_FILES_BUCKET)
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
        producao: format(ticketData.producao, 'yyyy-MM-dd'),
        user_id: user.id,
        email_gerente: gerenteEmail,
        email_diretor: diretorEmail,
        status: 'Aberta' as CobrancaTicketStatus,
        file_path: filePath,
        file_name: fileName,
      };

      const { data: newTicketData, error: insertError } = await supabase
        .from('tickets_cobranca')
        .insert(payload)
        .select()
        .single();
        
      if (insertError) {
        throw new Error(`Erro ao salvar ticket: ${insertError.message}`);
      }

      if (newTicketData) {
        // Disparar o webhook para N8N para novo ticket
        const webhookUrl = "https://n8n.portovaleconsorcio.com.br/webhook/213124asd144das"; // ESTE É O WEBHOOK
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo_evento: 'novo_ticket',
                protocolo: String(newTicketData.protocolo).padStart(4, '0'),
                motivo: newTicketData.motivo,
                nome_gerente: ticketData.gerente,
                celular_gerente: celularGerente,
            }),
        }).catch(webhookError => {
            console.error("Webhook para N8N falhou:", webhookError);
             toast({
                title: "Aviso de Webhook",
                description: "O ticket foi criado, mas a notificação pode não ter sido enviada.",
                variant: "default",
            });
        });
      }

      toast({ title: "Ticket de Apoio Criado", description: "Sua solicitação foi registrada com sucesso." });
      await fetchTickets();
      return true;

    } catch (err: any) {
      toast({ title: "Erro ao Criar Ticket", description: err.message, variant: "destructive" });
      console.error("Error adding cobranca ticket:", err);
      return false;
    } finally {
        setIsLoading(false);
    }
  };

  const updateTicket = async (ticketId: string, updates: Partial<CobrancaTicket>) => {
    // This function will now do a direct UPDATE, relying on RLS policies.
    const { error } = await supabase
      .from('tickets_cobranca')
      .update(updates)
      .eq('id', ticketId);
      
    if (error) {
      console.error('Error updating ticket status:', error);
      toast({ 
        title: "Erro ao Atualizar", 
        description: `Não foi possível atualizar o status. Detalhes: ${error.message}`, 
        variant: "destructive" 
      });
      return;
    }

    toast({ title: "Status Atualizado!", description: `O status do ticket foi alterado para ${updates.status}.` });
    await fetchTickets();
  };
  
  const updateTicketDetailsAndRetorno = async (
    ticketId: string,
    details: Partial<CobrancaTicket>,
  ): Promise<boolean> => {
    try {
      const { data: currentTicket, error: fetchError } = await supabase
        .from('tickets_cobranca')
        .select('*')
        .eq('id', ticketId)
        .single();
      
      if (fetchError || !currentTicket) {
        throw new Error("Não foi possível encontrar o ticket para atualização.");
      }

      const gerenteData = gerentesPorDiretor[details.diretor || '']?.find(g => g.name === details.gerente);
      const gerenteEmail = gerenteData?.email || null;
      const celularGerente = gerenteData?.celular || null;

      const diretorData = diretores.find(d => d.name === details.diretor);
      const diretorEmail = diretorData?.email || null;

      const updates: { [key: string]: any } = {
        ...details,
        email_gerente: gerenteEmail,
        email_diretor: diretorEmail,
        status: 'Reabertura', // Altera o status para 'Reabertura' sempre
      };
      
      const { error } = await supabase
        .from('tickets_cobranca')
        .update(updates)
        .eq('id', ticketId);

      if (error) {
        throw new Error(`Erro ao atualizar o ticket: ${error.message}`);
      }

      // Webhook é disparado ao salvar detalhes, notificando como reabertura
      const webhookUrl = "https://n8n.portovaleconsorcio.com.br/webhook/213124asd144das"; // ESTE É O WEBHOOK
      fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              tipo_evento: 'reabertura',
              protocolo: String(currentTicket.protocolo).padStart(4, '0'),
              motivo: currentTicket.motivo,
              nome_gerente: details.gerente,
              celular_gerente: celularGerente,
          }),
      }).catch(webhookError => console.error("Webhook de reabertura falhou:", webhookError));


      toast({ title: "Sucesso!", description: "As informações do ticket foram salvas e o status atualizado para 'Reabertura'." });
      await fetchTickets();
      return true;

    } catch (err: any) {
      toast({ title: "Erro ao Salvar", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const updateAndResolveTicket = async (
    ticketId: string,
    details: Partial<CobrancaTicket>,
  ): Promise<boolean> => {
      try {
          const gerenteData = gerentesPorDiretor[details.diretor || '']?.find(g => g.name === details.gerente);
          const gerenteEmail = gerenteData?.email || null;

          const diretorData = diretores.find(d => d.name === details.diretor);
          const diretorEmail = diretorData?.email || null;
          
          const updates = {
              ...details,
              email_gerente: gerenteEmail,
              email_diretor: diretorEmail,
              status: 'Resolvida' as CobrancaTicketStatus,
          };

          const { error } = await supabase
              .from('tickets_cobranca')
              .update(updates)
              .eq('id', ticketId);

          if (error) {
              throw new Error(`Erro ao resolver o ticket: ${error.message}`);
          }

          toast({ title: "Ticket Resolvido!", description: "As informações foram salvas e o ticket foi marcado como resolvido." });
          await fetchTickets();
          return true;
      } catch (err: any) {
          toast({ title: "Erro ao Resolver", description: err.message, variant: "destructive" });
          return false;
      }
  };

  const saveUserResponse = async (
      ticketId: string,
      statusRetorno: RetornoComercialStatus,
      commentText: string,
      author: string,
      files: File[]
  ): Promise<boolean> => {
      try {
          const { data: currentTicket, error: fetchError } = await supabase
            .from('tickets_cobranca')
            .select('obs_retorno, protocolo, motivo, user_id, gerente, comercial_files')
            .eq('id', ticketId)
            .single();

          if (fetchError || !currentTicket) {
              throw new Error(`Não foi possível buscar o ticket: ${fetchError.message}`);
          }
          
          let existingComments: RetornoComercialComment[] = [];
          if (currentTicket.obs_retorno) {
              if(Array.isArray(currentTicket.obs_retorno)) {
                  existingComments = currentTicket.obs_retorno;
              } else if (typeof currentTicket.obs_retorno === 'string') {
                  try {
                      existingComments = JSON.parse(currentTicket.obs_retorno);
                      if (!Array.isArray(existingComments)) existingComments = [];
                  } catch(e) {
                      existingComments = [{ text: currentTicket.obs_retorno, author: 'Sistema', timestamp: new Date().toISOString() }];
                  }
              }
          }

          const updatedComments = [...existingComments];
          if(commentText.trim()) {
            const newComment: RetornoComercialComment = {
                text: commentText,
                author: author,
                timestamp: new Date().toISOString(),
            };
            updatedComments.push(newComment);
          }
          
          let uploadedFiles: SolutionFile[] = [];
          if(files.length > 0) {
            const folderPath = `public/${ticketId}/comercial/${crypto.randomUUID()}`;
            for (const file of files) {
                const pathInBucket = `${folderPath}/${file.name}`;
                const { error: uploadError } = await supabase.storage
                    .from(COBRANCA_FILES_BUCKET)
                    .upload(pathInBucket, file);
                
                if (uploadError) {
                    throw new Error(`Erro no upload do arquivo ${file.name}: ${uploadError.message}`);
                }
                uploadedFiles.push({ file_path: pathInBucket, file_name: file.name });
            }
          }
          
          const existingComercialFiles = currentTicket.comercial_files || [];
          const updatedComercialFiles = [...existingComercialFiles, ...uploadedFiles];


          const { error } = await supabase
              .from('tickets_cobranca')
              .update({
                  status_retorno: statusRetorno,
                  obs_retorno: updatedComments,
                  status: 'Respondida',
                  comercial_files: updatedComercialFiles,
              })
              .eq('id', ticketId);

          if (error) {
            throw new Error(`Não foi possível salvar o retorno: ${error.message}`);
          }
          
          if(currentTicket && currentTicket.user_id) {
              const { data: profileData, error: profileError } = await supabase
                  .from('profiles')
                  .select('username')
                  .eq('id', currentTicket.user_id)
                  .single();

              if(profileError) {
                  console.warn(`Could not fetch creator's username: ${profileError.message}`);
              }
              
              const creatorUsername = profileData?.username || null;
              
              const webhookUrl = "https://n8n.portovaleconsorcio.com.br/webhook/nvrjgvnrejbgeerespostaticket";

              fetch(webhookUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      tipo_evento: 'resposta_ticket',
                      protocolo: String(currentTicket.protocolo).padStart(4, '0'),
                      motivo: currentTicket.motivo,
                      user_id: currentTicket.user_id, // ID do criador do ticket
                      username_criador: creatorUsername, // Nome do criador do ticket
                      nome_gerente: currentTicket.gerente, // Nome do gerente
                  }),
              }).catch(webhookError => {
                  console.error("Webhook de resposta de ticket falhou:", webhookError);
                  // Optional: inform user that notification might have failed
              });
          }

          toast({ title: "Resposta Enviada", description: "Sua resposta foi salva e o status do ticket foi atualizado para 'Respondida'." });
          await fetchTickets();
          return true;

      } catch(err: any) {
          toast({ title: "Erro ao Salvar Resposta", description: err.message, variant: "destructive" });
          return false;
      }
  };

  const deleteTicket = async (ticketId: string, filePath?: string | null) => {
    const originalTickets = tickets;
    // Optimistic update
    setTickets(prevTickets => prevTickets.filter(t => t.id !== ticketId));

    try {
      if (filePath) {
        const { error: removeError } = await supabase.storage.from(COBRANCA_FILES_BUCKET).remove([filePath]);
        if (removeError) {
          console.error(`Error deleting files for ticket ${ticketId}:`, removeError);
          toast({ title: "Erro ao Excluir Arquivos", description: "Não foi possível remover os anexos, mas a exclusão do ticket continuará.", variant: "destructive" });
        }
      }

      const { error: deleteError } = await supabase.rpc('delete_ticket_cobranca', {
        ticket_id_to_delete: ticketId
      });

      if (deleteError) {
        throw deleteError;
      }
      
      toast({ title: "Ticket Excluído", description: "O ticket de apoio foi removido com sucesso." });

    } catch (error: any) {
      setTickets(originalTickets);
      toast({ title: "Erro ao Excluir", description: `Não foi possível excluir o ticket: ${error.message}`, variant: "destructive" });
      console.error("Error deleting cobranca ticket:", error);
    }
  };
  
  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from(COBRANCA_FILES_BUCKET).download(filePath);
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
        .from(COBRANCA_FILES_BUCKET)
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


  const getTicketById = (ticketId: string): CobrancaTicket | undefined => {
    return tickets.find(ticket => ticket.id === ticketId);
  };


  return (
    <CobrancaTicketContext.Provider value={{ 
        tickets, 
        isLoading,
        error, 
        addTicket, 
        updateTicket,
        updateAndResolveTicket,
        updateTicketDetailsAndRetorno,
        saveUserResponse,
        deleteTicket,
        getTicketById,
        fetchTickets, 
        downloadFile,
        createPreviewUrl,
    }}>
      {children}
    </CobrancaTicketContext.Provider>
  );
}

export function useCobrancaTickets() {
  const context = useContext(CobrancaTicketContext);
  if (context === undefined) {
    throw new Error('useCobrancaTickets must be used within a CobrancaTicketProvider');
  }
  return context;
}

    