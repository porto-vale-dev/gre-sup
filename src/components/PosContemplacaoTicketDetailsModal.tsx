

"use client";

import type { PosContemplacaoTicket, PosContemplacaoTicketStatus, PosContemplacaoComment } from '@/types';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, User, Phone, MessageSquare, Tag, Edit, Ticket as TicketIcon, Users, Fingerprint, UserSquare, Mail, Save, BarChartHorizontal, CheckCircle, Loader2, Paperclip, Eye, Download, File, CalendarIcon as CalendarIconLucide, Trash2, MessageCircle as MessageCircleIcon } from 'lucide-react';
import { usePosContemplacaoTickets } from '@/contexts/PosContemplacaoTicketContext';
import { MOTIVOS_POS_CONTEMPLACAO, RESPONSAVEIS } from '@/lib/posContemplacaoData';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';


const FilePreviewItem: React.FC<{
  file: { file_path: string; file_name: string; };
  onDownload: (filePath: string, fileName: string) => void;
  onPreview: (filePath: string) => Promise<string | null>;
}> = ({ file, onDownload, onPreview }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

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

const parseObs = (obs: PosContemplacaoTicket['observacoes']): PosContemplacaoComment[] => {
    if (!obs) return [];
    if (Array.isArray(obs)) return obs;
    if (typeof obs === 'string') {
        try {
            const parsed = JSON.parse(obs);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            // It's a plain string, wrap it.
            return [{ text: obs, author: 'Sistema', timestamp: new Date().toISOString() }];
        }
    }
    return [];
};

interface PosContemplacaoTicketDetailsModalProps {
  ticket: PosContemplacaoTicket | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PosContemplacaoTicketDetailsModal({ ticket: initialTicket, isOpen, onClose }: PosContemplacaoTicketDetailsModalProps) {
  const { getTicketById, updateTicket, downloadFile, createPreviewUrl, deleteTicket } = usePosContemplacaoTickets();
  const { cargo, username, user } = useAuth();
  
  const ticket = initialTicket ? getTicketById(initialTicket.id) || initialTicket : null;

  // State for editable fields
  const [responsavel, setResponsavel] = useState(ticket?.responsavel || '');
  const [motivo, setMotivo] = useState(ticket?.motivo || '');
  const [newObservacao, setNewObservacao] = useState('');
  const [dataLimite, setDataLimite] = useState<Date | undefined>(undefined);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const allowedDeleteRoles = ['adm', 'greadmin', 'gre_con_admin', 'greadminsa'];
  const canDelete = cargo && allowedDeleteRoles.includes(cargo);

  const comments = useMemo(() => ticket ? parseObs(ticket.observacoes) : [], [ticket]);

  useEffect(() => {
    if (ticket) {
      setResponsavel(ticket.responsavel);
      setMotivo(ticket.motivo);
      setDataLimite(ticket.data_limite ? parseISO(ticket.data_limite) : undefined);
      setNewObservacao(''); // Clear new observation on modal open
    }
  }, [ticket, isOpen]);
  

  const handleSave = async () => {
    if (!ticket) return;
    setIsSaving(true);
    await updateTicket(ticket.id, { 
      responsavel, 
      motivo, 
      new_observacao: newObservacao,
      data_limite: dataLimite ? dataLimite.toISOString() : null,
    }, true);
    setIsSaving(false);
    onClose();
  };

  const handleSaveComment = async () => {
    if (!ticket || !newObservacao.trim()) return;
    setIsSaving(true);
    await updateTicket(ticket.id, { new_observacao: newObservacao }, false);
    setNewObservacao(''); // Clear textarea after saving
    setIsSaving(false);
  };


  const handleComplete = async () => {
    if (!ticket) return;
    setIsCompleting(true);
    await updateTicket(ticket.id, { 
        responsavel, 
        motivo, 
        new_observacao: newObservacao,
        data_limite: dataLimite ? dataLimite.toISOString() : null,
        status: 'Concluído' 
    }, true);
    setIsCompleting(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!ticket) return;
    setIsDeleting(true);
    await deleteTicket(ticket.id, ticket.file_path);
    setIsDeleting(false);
    onClose();
  };

  if (!ticket) return null;

  const protocolDisplay = ticket.protocolo ? String(ticket.protocolo).padStart(4, '0') : ticket.id.substring(0, 8);
  const submissionDate = parseISO(ticket.created_at);
  const formattedDate = isValid(submissionDate) 
    ? format(submissionDate, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
    : 'Data inválida';

  const renderAttachments = () => {
    if (!ticket.file_path || !ticket.file_name) {
      return null;
    }
    try {
      const fileNames = JSON.parse(ticket.file_name);
      if (Array.isArray(fileNames) && typeof ticket.file_path === 'string') {
        return (
          <div className="space-y-2">
            {fileNames.map((name: string, index: number) => (
              <FilePreviewItem 
                key={index}
                file={{ file_path: `${ticket.file_path}/${name}`, file_name: name }}
                onDownload={downloadFile} 
                onPreview={createPreviewUrl} 
              />
            ))}
          </div>
        );
      }
    } catch (e) {
        // Fallback for non-JSON or other errors
        return (
            <FilePreviewItem 
                file={{ file_path: ticket.file_path, file_name: ticket.file_name }}
                onDownload={downloadFile} 
                onPreview={createPreviewUrl} 
            />
        );
    }
    return null;
  };
  
  const findNameByEmail = (email: string) => {
    const user = RESPONSAVEIS.find(r => r.email.toLowerCase() === email.toLowerCase());
    return user ? user.name : email.split('@')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="font-headline text-2xl text-primary flex items-center">
            <TicketIcon className="mr-2 h-6 w-6" />Protocolo Pós-Contemplação #{protocolDisplay}
          </DialogTitle>
          <DialogDescription>
            Visualização e gestão do ticket de Pós-Contemplação.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto">
          <div className="px-6 py-4 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><UserSquare className="h-4 w-4" />Nome do Cliente:</strong>
                  <p>{ticket.nome_cliente}</p>
                </div>
                 <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Fingerprint className="h-4 w-4" />CPF ou CNPJ:</strong>
                  <p>{ticket.cpf}</p>
                </div>
                 <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Tag className="h-4 w-4" />Grupo / Cota:</strong>
                  <p>{ticket.grupo} / {ticket.cota}</p>
                </div>
                 <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Phone className="h-4 w-4" />Telefone:</strong>
                  <p>{ticket.telefone || 'Não informado'}</p>
                </div>
                <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Mail className="h-4 w-4" />E-mail:</strong>
                  <p>{ticket.email || 'Não informado'}</p>
                </div>
                <div>
                    <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Tag className="h-4 w-4" />SUSEP:</strong>
                    <p>{ticket.susep}</p>
                </div>
                <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Data de Abertura:</strong>
                  <p>{formattedDate}</p>
                </div>
                
                 <div className="flex flex-col gap-1.5">
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><CalendarIconLucide className="h-4 w-4" />Data Limite:</strong>
                   <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !dataLimite && "text-muted-foreground"
                            )}
                            >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {dataLimite ? format(dataLimite, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                            mode="single"
                            selected={dataLimite}
                            onSelect={(date) => setDataLimite(date || undefined)}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div>
                  <strong className="font-medium text-muted-foreground">Status:</strong>
                  <Badge variant={ticket.status === 'Concluído' ? 'default' : 'secondary'}>{ticket.status}</Badge>
                </div>
              </div>

              <Separator />

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <Label htmlFor="relator-select" className="font-medium text-muted-foreground flex items-center gap-1.5"><User className="h-4 w-4" />Relator:</Label>
                      <Select value={ticket.relator} disabled>
                        <SelectTrigger id="relator-select">
                          <SelectValue placeholder={findNameByEmail(ticket.relator)} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ticket.relator}>{findNameByEmail(ticket.relator)}</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor="responsavel-select" className="font-medium text-muted-foreground flex items-center gap-1.5"><Users className="h-4 w-4" />Responsável:</Label>
                      <Select value={responsavel} onValueChange={setResponsavel}>
                        <SelectTrigger id="responsavel-select">
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          {RESPONSAVEIS.map(r => (
                            <SelectItem key={r.email} value={r.email}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>
              </div>
              
              <Separator />
              <div className="space-y-1">
                <Label htmlFor="motivo-select" className="font-medium text-muted-foreground flex items-center gap-1.5"><MessageSquare className="h-4 w-4" />Motivo:</Label>
                <Select value={motivo} onValueChange={setMotivo}>
                  <SelectTrigger id="motivo-select">
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTIVOS_POS_CONTEMPLACAO.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />

              <div className="space-y-4">
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><MessageCircleIcon className="h-4 w-4" />Histórico de Observações:</strong>
                  {comments.length > 0 ? (
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 border rounded-md p-3">
                        {comments.map((comment, index) => (
                           <div key={index} className="text-sm bg-muted/50 p-3 rounded-md">
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="font-semibold text-primary">{comment.author}</span>
                                <span className="text-xs text-muted-foreground">{format(parseISO(comment.timestamp), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}</span>
                              </div>
                             <p className="whitespace-pre-wrap break-words">{comment.text}</p>
                           </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic p-4 border-dashed border rounded-md text-center">Nenhuma observação registrada.</p>
                  )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes-solicitacao">Nova Observação:</Label>
                <Textarea
                  id="observacoes-solicitacao"
                  placeholder="Adicione uma nova observação ao histórico..."
                  className="whitespace-pre-wrap break-words bg-background p-3 rounded-md min-h-[100px] resize-y"
                  value={newObservacao}
                  onChange={(e) => setNewObservacao(e.target.value)}
                />
                 <Button variant="secondary" size="sm" onClick={handleSaveComment} disabled={isSaving || isCompleting || !newObservacao.trim()} className="mt-2">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Comentário
                </Button>
              </div>

               {ticket.file_path && ticket.file_name && (
                <>
                  <Separator />
                  <div>
                    <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Paperclip className="h-4 w-4" />Arquivos Anexados:</strong>
                    {renderAttachments()}
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
        
        <DialogFooter className="px-6 pb-6 pt-4 border-t flex-wrap justify-between items-center gap-2 shrink-0">
            <div>
              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>
                      {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o ticket e todos os seus anexos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        Sim, excluir ticket
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={onClose} className="w-full">Fechar</Button>
              <Button onClick={handleSave} disabled={isSaving || isCompleting} className="w-full">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
               <Button onClick={handleComplete} disabled={isCompleting || isSaving} className="w-full bg-green-600 hover:bg-green-700">
                {isCompleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                {isCompleting ? 'Concluindo...' : 'Salvar e Concluir'}
              </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
