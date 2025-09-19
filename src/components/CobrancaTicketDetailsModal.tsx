

"use client";

import type { CobrancaTicket, RetornoComercialStatus, RetornoComercialComment } from '@/types';
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, User, Phone, MessageSquare, Tag, Edit, Ticket as TicketIcon, Users, Fingerprint, UserSquare, Mail, Save, BarChartHorizontal, CheckCircle, Loader2, MessageCircle } from 'lucide-react';
import { useCobrancaTickets } from '@/contexts/CobrancaTicketContext';
import { useToast } from '@/hooks/use-toast';
import { RETORNO_COMERCIAL_STATUSES, diretores, gerentesPorDiretor, type Gerente } from '@/lib/cobrancaData';
import { useAuth } from '@/contexts/AuthContext';


interface CobrancaTicketDetailsModalProps {
  ticket: CobrancaTicket | null;
  isOpen: boolean;
  onClose: () => void;
  isUserResponseView?: boolean;
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

export function CobrancaTicketDetailsModal({ ticket: initialTicket, isOpen, onClose, isUserResponseView = false }: CobrancaTicketDetailsModalProps) {
  const { getTicketById, updateTicketDetailsAndRetorno, updateTicket, saveUserResponse, updateAndResolveTicket } = useCobrancaTickets();
  const { toast } = useToast();
  const { username } = useAuth();
  
  const ticket = initialTicket ? getTicketById(initialTicket.id) || initialTicket : null;

  // State for editable fields
  const [diretor, setDiretor] = useState(ticket?.diretor || '');
  const [gerente, setGerente] = useState(ticket?.gerente || '');
  const [observacoes, setObservacoes] = useState(ticket?.observacoes || '');
  const [availableGerentes, setAvailableGerentes] = useState<Gerente[]>([]);

  // State for Retorno do Comercial
  const [retornoStatus, setRetornoStatus] = useState<RetornoComercialStatus | undefined>(ticket?.status_retorno || undefined);
  const [newRetornoObs, setNewRetornoObs] = useState("");
  const [comments, setComments] = useState<RetornoComercialComment[]>([]);

  
  const [isSaving, setIsSaving] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (ticket) {
      setDiretor(ticket.diretor);
      setGerente(ticket.gerente);
      setObservacoes(ticket.observacoes || '');
      setRetornoStatus(ticket.status_retorno || undefined);
      
      const parsedComments = parseComments(ticket.obs_retorno);
      setComments(parsedComments);
      setNewRetornoObs("");
      
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
        { diretor, gerente, observacoes },
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
     if (!newRetornoObs.trim()) {
      toast({ title: "Campo Obrigatório", description: "Por favor, escreva uma observação.", variant: 'destructive' });
      return;
    }


    setIsSaving(true);
    const success = await saveUserResponse(ticket.id, retornoStatus, newRetornoObs, username || 'Usuário');
    if (success) {
      setNewRetornoObs("");
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
        observacoes,
    });
    
    if (success) {
        onClose();
    }
    
    setIsResolving(false);
  };

  if (!ticket) return null;

  const protocolDisplay = ticket.protocolo ? String(ticket.protocolo).padStart(4, '0') : ticket.id.substring(0, 8);
  const isRetornoDisabled = isSaving || !isUserResponseView;
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
                <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><UserSquare className="h-4 w-4" />Nome do Cliente:</strong>
                  <p>{ticket.nome_cliente}</p>
                </div>
                 <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Fingerprint className="h-4 w-4" />CPF ou CNPJ do Cliente:</strong>
                  <p>{ticket.cpf}</p>
                </div>
                 <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Tag className="h-4 w-4" />Cota:</strong>
                  <p>{ticket.cota}</p>
                </div>
                <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><BarChartHorizontal className="h-4 w-4" />Produção:</strong>
                  <p>{ticket.producao}</p>
                </div>
                <div>
                  <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Phone className="h-4 w-4" />Telefone:</strong>
                  <p>{ticket.telefone}</p>
                </div>
                 {ticket.email && (
                  <div>
                    <strong className="font-medium text-muted-foreground flex items-center gap-1.5"><Mail className="h-4 w-4" />E-mail do Cliente:</strong>
                    <p>{ticket.email}</p>
                  </div>
                )}
                 <div className="space-y-1">
                  <Label htmlFor="diretor-select" className="font-medium text-muted-foreground flex items-center gap-1.5"><User className="h-4 w-4" />Diretor:</Label>
                  <Select value={diretor} onValueChange={handleDiretorChange} disabled={isUserResponseView}>
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
                  <Select value={gerente} onValueChange={setGerente} disabled={availableGerentes.length === 0 || isUserResponseView}>
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
                  disabled={isUserResponseView}
                />
              </div>

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

            </div>
          </div>
        </div>
        
        <DialogFooter className="px-6 pb-6 pt-4 border-t flex-wrap sm:flex-nowrap justify-between items-center gap-2 shrink-0">
            {isUserResponseView ? (
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
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Salvando...' : 'Salvar Detalhes'}
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
