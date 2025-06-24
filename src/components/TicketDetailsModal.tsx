
"use client";

import type { Ticket, SolutionFile } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState, useEffect, type ChangeEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Clock, User, Phone, MessageSquare, Paperclip, Tag, Info, Download, Eye, UploadCloud, File, X, Save, Edit } from 'lucide-react';
import { useTickets } from '@/contexts/TicketContext';
import { useToast } from '@/hooks/use-toast';
import { ALLOWED_FILE_TYPES, MAX_SOLUTION_FILE_SIZE } from '@/lib/constants';

interface TicketDetailsModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

const FilePreviewItem: React.FC<{
  file: SolutionFile;
  onDownload: (filePath: string, fileName: string) => void;
  onPreview: (filePath: string) => Promise<string | null>;
}> = ({ file, onDownload, onPreview }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const { toast } = useToast();

  const isPreviewable = file.file_name && /\.(pdf|jpg|jpeg|png|gif|txt)$/i.test(file.file_name);

  const handlePreviewClick = async () => {
    setIsPreviewing(true);
    const url = await onPreview(file.file_path);
    setIsPreviewing(false);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownloadClick = async () => {
    setIsDownloading(true);
    await onDownload(file.file_path, file.file_name);
    setIsDownloading(false);
  };

  return (
    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
      <div className="flex items-center gap-2 truncate">
        <File className="h-4 w-4 shrink-0" />
        <span className="truncate" title={file.file_name}>{file.file_name}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {isPreviewable && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePreviewClick} disabled={isPreviewing}>
            <Eye className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownloadClick} disabled={isDownloading}>
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export function TicketDetailsModal({ ticket: initialTicket, isOpen, onClose }: TicketDetailsModalProps) {
  const { downloadFile, createPreviewUrl, updateTicketSolution, getTicketById } = useTickets();
  const { toast } = useToast();
  
  // The ticket from props can be stale. Get the live version from the context.
  const ticket = initialTicket ? getTicketById(initialTicket.id) || initialTicket : null;

  const [solutionText, setSolutionText] = useState('');
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // This effect now only resets the form state when a new ticket is opened.
    if (ticket) {
      setSolutionText(ticket.solution || '');
      setStagedFiles([]);
    }
  }, [ticket?.id]); // Depend on ticket.id to re-initialize only when the ticket changes.

  if (!ticket) return null;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      let validFiles = [...stagedFiles];
      let error = false;
      for (const file of newFiles) {
        if (file.size > MAX_SOLUTION_FILE_SIZE) {
          toast({ variant: 'destructive', title: 'Arquivo muito grande', description: `O arquivo ${file.name} excede o limite de 100MB.` });
          error = true;
          continue;
        }
        validFiles.push(file);
      }
      setStagedFiles(validFiles);
      if(error) {
        event.target.value = ""; // Reset file input if any file is invalid
      }
    }
  };
  
  const removeStagedFile = (index: number) => {
    setStagedFiles(stagedFiles.filter((_, i) => i !== index));
  };

  const handleSaveSolution = async () => {
    setIsSaving(true);
    try {
      await updateTicketSolution(ticket.id, solutionText, stagedFiles);
      setStagedFiles([]); // Clear staged files on success
    } catch (error) {
      // Toast is already shown in context
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary flex items-center">
            <Info className="mr-2 h-6 w-6" />Detalhes do Ticket #{ticket.id.substring(0, 8)}
          </DialogTitle>
          <DialogDescription>
            Visualização completa e gestão do ticket.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow min-h-0 pr-6 -mr-6">
          <div className="space-y-6 py-4">
            {/* Ticket Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><User className="h-4 w-4" />Nome:</strong>
                  <p>{ticket.name}</p>
                </div>
                <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Phone className="h-4 w-4" />Telefone:</strong>
                  <p>{ticket.phone}</p>
                </div>
                <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Data de Abertura:</strong>
                  <p>{format(parseISO(ticket.submission_date), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
                </div>
                <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Clock className="h-4 w-4" />Previsão de Resposta:</strong>
                  <p>{ticket.estimated_response_time}</p>
                </div>
                <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Tag className="h-4 w-4" />Responsável:</strong>
                  <p>{ticket.responsible || "Não atribuído"}</p>
                </div>
                <div>
                  <strong className="font-medium text-muted-foreground">Status:</strong>
                  <Badge variant={ticket.status === 'Concluído' ? 'default' : ticket.status === 'Atrasado' ? 'destructive' : 'secondary'}>{ticket.status}</Badge>
                </div>
              </div>
              <Separator />
              <div>
                <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><MessageSquare className="h-4 w-4" />Motivo do Ticket:</strong>
                <p>{ticket.reason}</p>
              </div>
              {ticket.observations && (
                <>
                  <Separator />
                  <div>
                    <strong className="font-medium text-muted-foreground">Observações:</strong>
                    <p className="whitespace-pre-wrap break-words bg-muted/50 p-3 rounded-md max-h-40 overflow-y-auto">{ticket.observations}</p>
                  </div>
                </>
              )}
              {ticket.file_path && ticket.file_name && (
                <>
                  <Separator />
                  <div>
                    <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Paperclip className="h-4 w-4" />Arquivo Anexado:</strong>
                    <FilePreviewItem file={{ file_path: ticket.file_path, file_name: ticket.file_name }} onDownload={downloadFile} onPreview={createPreviewUrl} />
                  </div>
                </>
              )}
            </div>

            <Separator className="my-6" />

            {/* Solution Section */}
            <div className="space-y-4">
               <h3 className="font-headline text-lg text-primary flex items-center gap-2">
                <Edit className="h-5 w-5" /> Solução do Atendimento
              </h3>

              <div>
                <Label htmlFor="solution-text">Descrição da Solução</Label>
                <Textarea
                  id="solution-text"
                  placeholder="Descreva a solução aplicada para este ticket..."
                  className="min-h-[120px] resize-y mt-1"
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="solution-files-upload">Arquivos da Solução</Label>
                
                {/* File Input */}
                <div className="relative">
                  <Input
                    id="solution-files-upload"
                    type="file"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept={ALLOWED_FILE_TYPES.join(',')}
                    disabled={isSaving}
                  />
                  <Label
                    htmlFor="solution-files-upload"
                    className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-muted rounded-md cursor-pointer hover:border-primary transition-colors"
                  >
                    <UploadCloud className="h-6 w-6 text-muted-foreground" />
                    <span className="text-muted-foreground">Clique para adicionar arquivos</span>
                  </Label>
                </div>
                 <p className="text-xs text-muted-foreground">Tamanho máximo por arquivo: 100MB.</p>
                
                {/* Staged Files for Upload */}
                {stagedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Novos arquivos para upload:</p>
                    {stagedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                        <span className="text-sm truncate">{file.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeStagedFile(index)} disabled={isSaving}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Existing Solution Files */}
                {ticket.solution_files && ticket.solution_files.length > 0 && (
                  <div className="space-y-2 rounded-md border p-2">
                     <p className="text-sm text-muted-foreground">Arquivos anexados:</p>
                    {ticket.solution_files.map((file) => (
                       <FilePreviewItem key={file.file_path} file={file} onDownload={downloadFile} onPreview={createPreviewUrl} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="pt-4 border-t gap-2">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={handleSaveSolution} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar Solução'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
