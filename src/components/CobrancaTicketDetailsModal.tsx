

"use client";

import type { CobrancaTicket, RetornoComercialStatus, RetornoComercialComment, SolutionFile } from '@/types';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState, useEffect } from 'react';
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, User, Phone, MessageSquare, Tag, Edit, Ticket as TicketIcon, Users, Fingerprint, UserSquare, Mail, Save, BarChartHorizontal, CheckCircle, Loader2, MessageCircle, Trash2, Paperclip, File, Eye, Download, Calendar as CalendarIconLucide, UploadCloud, X } from 'lucide-react';
import { useCobrancaTickets } from '@/contexts/CobrancaTicketContext';
import { useToast } from '@/hooks/use-toast';
import { RETORNO_COMERCIAL_STATUSES, diretores, gerentesPorDiretor, type Gerente } from '@/lib/cobrancaData';
import { useAuth } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ALLOWED_FILE_TYPES, MAX_SOLUTION_FILE_SIZE } from '@/lib/constants';

const FilePreviewItem: React.FC<{
  file: { file_path: string; file_name: string; };
  onDownload: (filePath: string, fileName: string) => Promise<void>;
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
            {isPreviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownloadClick} disabled={isDownloading}>
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};


interface CobrancaTicketDetailsModalProps {
  ticket: CobrancaTicket | null;
  isOpen: boolean;
  onClose: () => void;
  isUserResponseView?: boolean;
  userCargo?: string | null;
}

const parseComments = (obs: string | RetornoComercialComment[] | null | undefined): RetornoComercialComment[] => {
    if (!obs) return [];
    if (Array.isArray(obs)) return obs;
    if (typeof obs === 'string') {
        try {
            // Attempt to parse if it's a JSON string
            const parsed = JSON.parse(obs);
            if(Array.isArray(parsed)) return parsed;
        } catch (e) {
            // If it's just a plain string, wrap it in the new format
             return [{ text: obs, author: 'Sistema', timestamp: new Date().toISOString() }];
        }
    }
    return [];
}

const formatCpfCnpj = (value: string) => {
  const cleanedValue = value.replace(/\D/g, '');
  if (cleanedValue.length <= 11) {
    return cleanedValue.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    return cleanedValue.substring(0, 14).replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
};

const formatPhone = (value: string) => {
  const cleanedValue = value.replace(/\D/g, '');
  const length = cleanedValue.length;
  if (length <= 2) return `(${cleanedValue}`;
  let formatted = `(${cleanedValue.substring(0, 2)}) `;
  if (length <= 6) return formatted + cleanedValue.substring(2);
  if (length <= 10) return formatted + `${cleanedValue.substring(2, 6)}-${cleanedValue.substring(6)}`;
  return formatted + `${cleanedValue.substring(2, 7)}-${cleanedValue.substring(7, 11)}`;
};

export function CobrancaTicketDetailsModal({ ticket: initialTicket, isOpen, onClose, isUserResponseView = false, userCargo }: CobrancaTicketDetailsModalProps) {
  const { getTicketById, updateTicketDetailsAndRetorno, updateAndResolveTicket, saveUserResponse, deleteTicket, downloadFile, createPreviewUrl } = useCobrancaTickets();
  const { toast } = useToast();
  const { username, cargo } = useAuth();
  
  const ticket = initialTicket ? getTicketById(initialTicket.id) || initialTicket : null;

  // State for editable fields
  const [nomeCliente, setNomeCliente] = useState(ticket?.nome_cliente || '');
  const [cpf, setCpf] = useState(ticket?.cpf || '');
  const [cota, setCota] = useState(ticket?.cota || '');
  const [producao, setProducao] = useState<Date | undefined>(undefined);
  const [telefone, setTelefone] = useState(ticket?.telefone || '');
  const [email, setEmail] = useState(ticket?.email || '');

  const [diretor, setDiretor] = useState(ticket?.diretor || '');
  const [gerente, setGerente] = useState(ticket?.gerente || '');
  const [vendedor, setVendedor] = useState(ticket?.vendedor || '');
  const [observacoes, setObservacoes] = useState(ticket?.observacoes || '');
  const [availableGerentes, setAvailableGerentes] = useState<Gerente[]>([]);

  // State for Retorno do Comercial
  const [retornoStatus, setRetornoStatus] = useState<RetornoComercialStatus | undefined>(ticket?.status_retorno || undefined);
  const [newRetornoObs, setNewRetornoObs] = useState("");
  const [comments, setComments] = useState<RetornoComercialComment[]>([]);
  const [stagedComercialFiles, setStagedComercialFiles] = useState<File[]>([]);

  
  const [isSaving, setIsSaving] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const managerRoles = ['gerente', 'gerente1', 'diretor'];
  const effectiveCargo = userCargo || cargo;
  const isManagerView = !!(isUserResponseView || (effectiveCargo && managerRoles.includes(effectiveCargo)));
  
  const allowedDeleteRoles = ['adm', 'greadmin', 'greadminsa'];
  const canDelete = cargo && allowedDeleteRoles.includes(cargo);


  useEffect(() => {
    if (ticket) {
      setNomeCliente(ticket.nome_cliente);
      setCpf(ticket.cpf);
      setCota(ticket.cota);
      setProducao(ticket.producao ? parseISO(ticket.producao) : undefined);
      setTelefone(ticket.telefone);
      setEmail(ticket.email);

      setDiretor(ticket.diretor);
      setGerente(ticket.gerente);
      setVendedor(ticket.vendedor || '');
      setObservacoes(ticket.observacoes || '');
      setRetornoStatus(ticket.status_retorno || undefined);
      
      const parsedComments = parseComments(ticket.obs_retorno);
      setComments(parsedComments);
      setNewRetornoObs("");
      setStagedComercialFiles([]);
      
      if (ticket.diretor && gerentesPorDiretor[ticket.diretor]) {
        setAvailableGerentes(gerentesPorDiretor[ticket.diretor]);
      } else {
        setAvailableGerentes([]);
      }
    }
  }, [ticket, isOpen]); 
  
  const handleDiretorChange = (newDiretor: string) => {
    setDiretor(newDiretor);
    setAvailableGerentes(gerentesPorDiretor[newDiretor] || []);
    setGerente(''); 
  };

  const handleSave = async () => {
    if (!ticket) return;

    setIsSaving(true);

    const success = await updateTicketDetailsAndRetorno(
        ticket.id, 
        { 
          diretor, 
          gerente,
          vendedor,
          observacoes,
          nome_cliente: nomeCliente,
          cpf,
          cota,
          producao: producao ? format(producao, 'yyyy-MM-dd') : undefined,
          telefone,
          email
        },
    );

    if(success) {
      onClose();
    }
    
    setIsSaving(false);
  };
  
  const handleUserResponseSave = async () => {
    if (!ticket) return;
    if (!retornoStatus) {
        toast({ title: "Campo Obrigatório", description: "Por favor, selecione um status para a sua resposta.", variant: 'destructive' });
        return;
    }
     if (!newRetornoObs.trim() && stagedComercialFiles.length === 0) {
      toast({ title: "Campo Obrigatório", description: "Por favor, escreva uma observação ou anexe um arquivo.", variant: 'destructive' });
      return;
    }


    setIsSaving(true);
    const success = await saveUserResponse(ticket.id, retornoStatus, newRetornoObs, username || 'Usuário', stagedComercialFiles);
    if (success) {
      setNewRetornoObs("");
      setStagedComercialFiles([]);
      onClose();
    }
    setIsSaving(false);
  };


  const handleMarkAsResolved = async () => {
    if (!ticket) return;
    setIsResolving(true);
    
    const success = await updateAndResolveTicket(ticket.id, {
        diretor,
        gerente,
        vendedor,
        observacoes,
        nome_cliente: nomeCliente,
        cpf,
        cota,
        producao: producao ? format(producao, 'yyyy-MM-dd') : undefined,
        telefone,
        email
    });
    
    if (success) {
        onClose();
    }
    
    setIsResolving(false);
  };

  const handleDelete = async () => {
    if (!ticket) return;
    setIsDeleting(true);
    await deleteTicket(ticket.id, ticket.file_path);
    setIsDeleting(false);
    onClose();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      let validFiles = [...stagedComercialFiles];
      let error = false;
      for (const file of newFiles) {
        if (file.size > MAX_SOLUTION_FILE_SIZE) {
          toast({ variant: 'destructive', title: 'Arquivo muito grande', description: `O arquivo ${file.name} excede o limite de 100MB.` });
          error = true;
          continue;
        }
        validFiles.push(file);
      }
      setStagedComercialFiles(validFiles);
      if(error) {
        event.target.value = "";
      }
    }
  };

  const removeStagedFile = (index: number) => {
    setStagedComercialFiles(stagedComercialFiles.filter((_, i) => i !== index));
  };


  if (!ticket) return null;
  
  const renderAttachments = (files: SolutionFile[] | undefined | null) => {
    if (!files || files.length === 0) {
      return null;
    }
    return (
      <div className="space-y-2">
        {files.map((file, index) => (
          <FilePreviewItem 
            key={index}
            file={file}
            onDownload={downloadFile} 
            onPreview={createPreviewUrl} 
          />
        ))}
      </div>
    );
  };

  const renderInitialAttachments = () => {
    if (!ticket.file_path || !ticket.file_name) {
      return null;
    }
    try {
      // New multi-file format: file_name is a JSON array of strings
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
      // Fallback for old single-file format (or if file_name is not a JSON array)
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

  const protocolDisplay = ticket.protocolo ? String(ticket.protocolo).padStart(4, '0') : ticket.id.substring(0, 8);
  const isRetornoDisabled = isSaving;
  const isDetailsDisabled = isSaving || isResolving || isManagerView;
  
  const submissionDateString = ticket.created_at || ticket.data_atend;
  const submissionDate = submissionDateString ? parseISO(submissionDateString) : null;
  const formattedDate = submissionDate && isValid(submissionDate) 
    ? format(submissionDate, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
    : 'Data inválida';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="font-headline text-2xl text-primary flex items-center">
            <TicketIcon className="mr-2 h-6 w-6" />Protocolo de Apoio #{protocolDisplay}
          </DialogTitle>
          <DialogDescription>
            Visualização completa e gestão do ticket de apoio ao comercial.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto">
          <div className="px-6 py-4 space-y-6">
            {/* Ticket Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <Label htmlFor="nome_cliente" className="font-medium text-muted-foreground flex items-center gap-1.5"><UserSquare className="h-4 w-4" />Nome do Cliente:</Label>
                  <Input id="nome_cliente" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} disabled={isDetailsDisabled} />
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="cpf_cnpj" className="font-medium text-muted-foreground flex items-center gap-1.5"><Fingerprint className="h-4 w-4" />CPF ou CNPJ do Cliente:</Label>
                  <Input id="cpf_cnpj" value={cpf} onChange={(e) => setCpf(formatCpfCnpj(e.target.value))} disabled={isDetailsDisabled} />
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="cota" className="font-medium text-muted-foreground flex items-center gap-1.5"><Tag className="h-4 w-4" />Cota:</Label>
                  <Input id="cota" value={cota} onChange={(e) => setCota(e.target.value)} disabled={isDetailsDisabled} />
                </div>
                 <div className="space-y-1 flex flex-col">
                  <Label htmlFor="data_venda" className="font-medium text-muted-foreground flex items-center gap-1.5"><BarChartHorizontal className="h-4 w-4" />Data de Venda:</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !producao && "text-muted-foreground"
                        )}
                        disabled={isDetailsDisabled}
                      >
                        <CalendarIconLucide className="mr-2 h-4 w-4" />
                        {producao ? format(producao, "dd/MM/yyyy") : <span>Escolha uma data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={producao}
                        onSelect={setProducao}
                        initialFocus
                        disabled={isDetailsDisabled}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="telefone" className="font-medium text-muted-foreground flex items-center gap-1.5"><Phone className="h-4 w-4" />Telefone:</Label>
                  <Input id="telefone" value={telefone} onChange={(e) => setTelefone(formatPhone(e.target.value))} disabled={isDetailsDisabled} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="email" className="font-medium text-muted-foreground flex items-center gap-1.5"><Mail className="h-4 w-4" />E-mail do Cliente:</Label>
                    <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isDetailsDisabled} />
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="diretor-select" className="font-medium text-muted-foreground flex items-center gap-1.5"><User className="h-4 w-4" />Diretor:</Label>
                  <Select value={diretor} onValueChange={handleDiretorChange} disabled={isDetailsDisabled}>
                    <SelectTrigger id="diretor-select">
                      <SelectValue placeholder="Selecione o diretor" />
                    </SelectTrigger>
                    <SelectContent>
                      {diretores.map(d => (
                        <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="gerente-select" className="font-medium text-muted-foreground flex items-center gap-1.5"><Users className="h-4 w-4" />Gerente:</Label>
                  <Select value={gerente} onValueChange={setGerente} disabled={availableGerentes.length === 0 || isDetailsDisabled}>
                    <SelectTrigger id="gerente-select">
                      <SelectValue placeholder="Selecione o gerente" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGerentes.map(g => (
                        <SelectItem key={g.name} value={g.name}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vendedor" className="font-medium text-muted-foreground flex items-center gap-1.5"><UserSquare className="h-4 w-4" />Vendedor:</Label>
                  <Input id="vendedor" value={vendedor} onChange={(e) => setVendedor(e.target.value)} disabled={isDetailsDisabled} />
                </div>
                <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Data de Abertura:</strong>
                  <p>{formattedDate}</p>
                </div>
                <div>
                  <strong className="font-medium text-muted-foreground">Status:</strong>
                  <Badge variant={ticket.status === 'Resolvida' ? 'default' : ticket.status === 'Fora do prazo' ? 'destructive' : 'secondary'}>{ticket.status}</Badge>
                </div>
              </div>
              <Separator />
              <div>
                <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><MessageSquare className="h-4 w-4" />Motivo da Solicitação:</strong>
                <p>{ticket.motivo}</p>
              </div>
              
              <Separator />
              <div className="space-y-1">
                <Label htmlFor="observacoes-solicitacao">Observações da Solicitação:</Label>
                <Textarea
                  id="observacoes-solicitacao"
                  className="whitespace-pre-wrap break-words bg-background p-3 rounded-md min-h-[100px] resize-y"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  disabled={isDetailsDisabled}
                />
              </div>

               {ticket.file_path && ticket.file_name && (
                <>
                  <Separator />
                  <div>
                    <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Paperclip className="h-4 w-4" />Arquivos Anexados:</strong>
                    {renderInitialAttachments()}
                  </div>
                </>
              )}

            </div>

            <Separator className="my-6" />

            {/* Retorno do Comercial Section */}
            <div className="space-y-4">
              <h3 className="font-headline text-lg text-primary flex items-center gap-2">
                <Edit className="h-5 w-5" /> Retorno do Comercial
              </h3>
              
              <div className="space-y-1.5">
                <Label htmlFor="retorno-status">Status do Retorno</Label>
                <Select value={retornoStatus} onValueChange={(val) => setRetornoStatus(val as RetornoComercialStatus)} disabled={isRetornoDisabled}>
                    <SelectTrigger id="retorno-status">
                        <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                        {RETORNO_COMERCIAL_STATUSES.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><MessageCircle className="h-4 w-4" />Histórico de Observações:</strong>
                  {comments.length > 0 ? (
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {comments.map((comment, index) => (
                           <div key={index} className="text-sm bg-muted/50 p-3 rounded-md">
                             <p className="whitespace-pre-wrap break-words">{comment.text}</p>
                           </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Nenhuma observação registrada.</p>
                  )}
              </div>
              
               <div>
                <Label htmlFor="retorno-obs">Nova Observação</Label>
                <Textarea
                  id="retorno-obs"
                  placeholder="Escreva um novo comentário..."
                  className="min-h-[120px] resize-y mt-1"
                  value={newRetornoObs}
                  onChange={(e) => setNewRetornoObs(e.target.value)}
                  disabled={isRetornoDisabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comercial-files-upload">Anexos do Comercial</Label>
                <div className="relative">
                  <Input
                    id="comercial-files-upload"
                    type="file"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept={ALLOWED_FILE_TYPES.join(',')}
                    disabled={isRetornoDisabled}
                  />
                  <Label
                    htmlFor="comercial-files-upload"
                    className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-muted rounded-md cursor-pointer hover:border-primary transition-colors"
                  >
                    <UploadCloud className="h-6 w-6 text-muted-foreground" />
                    <span className="text-muted-foreground">Clique para adicionar arquivos</span>
                  </Label>
                </div>
                 <p className="text-xs text-muted-foreground">Tamanho máximo por arquivo: 100MB.</p>
                
                {stagedComercialFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Novos arquivos para upload:</p>
                    {stagedComercialFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                        <span className="text-sm truncate">{file.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeStagedFile(index)} disabled={isRetornoDisabled}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {ticket.comercial_files && ticket.comercial_files.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Arquivos já anexados:</p>
                        {renderAttachments(ticket.comercial_files)}
                    </div>
                )}
              </div>

            </div>
          </div>
        </div>
        
        <DialogFooter className="px-6 pb-6 pt-4 border-t flex-wrap sm:flex-nowrap justify-between items-center gap-2 shrink-0">
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
            {isManagerView ? (
                <>
                    <div className="flex-grow" />
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Fechar</Button>
                    <Button onClick={handleUserResponseSave} disabled={isSaving} className="w-full sm:w-auto">
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Salvar Resposta
                    </Button>
                </>
            ) : (
                <>
                    <div className="flex-grow hidden sm:block" />
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button variant="outline" onClick={onClose} className="w-full">Fechar</Button>
                      <Button onClick={handleSave} disabled={isSaving || isResolving} className="w-full">
                        {isSaving && !isResolving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving && !isResolving ? 'Salvando...' : 'Salvar Detalhes'}
                      </Button>
                       <Button onClick={handleMarkAsResolved} disabled={isResolving || isSaving} className="w-full bg-green-600 hover:bg-green-700">
                        {isResolving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        {isResolving ? 'Resolvendo...' : 'Salvar e Resolver'}
                      </Button>
                    </div>
                </>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    