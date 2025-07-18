
"use client";

import { useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ticketSchema, type TicketFormData } from '@/lib/schemas';
import { TICKET_REASONS, ALLOWED_FILE_TYPES, MAX_OBSERVATIONS_LENGTH, MAX_FILES_COUNT } from '@/lib/constants';
import { useTickets } from '@/contexts/TicketContext';
import { useToast } from "@/hooks/use-toast";
import { FileText, Info, Send, Paperclip, UploadCloud, AlertTriangle, X } from 'lucide-react';

export function TicketForm() {
  const [selectedReason, setSelectedReason] = useState<(typeof TICKET_REASONS)[0] | null>(null);
  const { addTicket } = useTickets();
  const { toast } = useToast();

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      name: "",
      phone: "",
      client_name: "",
      cpf: "",
      grupo: "",
      cota: "",
      reason: "",
      observations: "",
      file: undefined,
    },
  });

  const selectedFiles = form.watch("file");
  const selectedFilesArray = selectedFiles ? Array.from(selectedFiles) : [];

  const handleReasonChange = (value: string) => {
    const reason = TICKET_REASONS.find(r => r.value === value) || null;
    setSelectedReason(reason);
    form.setValue("reason", value);
  };
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
        form.setValue("file", files, { shouldValidate: true });
    }
  };

  const removeFile = (indexToRemove: number) => {
    const currentFiles = selectedFilesArray;
    const updatedFiles = currentFiles.filter((_, index) => index !== indexToRemove);

    // Create a new FileList
    const dataTransfer = new DataTransfer();
    updatedFiles.forEach(file => dataTransfer.items.add(file));

    form.setValue("file", dataTransfer.files, { shouldValidate: true });
  };


  async function onSubmit(data: TicketFormData) {
    const filesToUpload = data.file ? Array.from(data.file) : undefined;
    
    const ticketPayload = {
      name: data.name,
      phone: data.phone,
      client_name: data.client_name,
      cpf: data.cpf,
      grupo: data.grupo,
      cota: data.cota,
      reason: data.reason,
      estimated_response_time: selectedReason?.responseTime || "N/A",
      observations: data.observations,
      files: filesToUpload,
    };

    const success = await addTicket(ticketPayload);

    if (success) {
      form.reset();
      setSelectedReason(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="font-headline text-3xl text-primary flex shrink-0 items-center gap-2">
            <FileText className="h-8 w-8" /> Abrir Novo Ticket
          </CardTitle>
          <div className="flex w-full items-center gap-2 rounded-lg border border-accent/50 bg-accent/10 p-2 text-accent sm:w-auto">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Atenção!</p>
              <p className="text-xs font-semibold">
                ABRA UM TICKET POR SOLICITAÇÃO
              </p>
            </div>
          </div>
        </div>
        <CardDescription>
          Preencha o formulário abaixo para registrar seu chamado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo do Solicitante</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone para Contato</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="(XX) XXXXX-XXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Nome do cliente</FormLabel>
                    <FormControl>
                        <Input placeholder="Nome completo do cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF do cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="000.000.000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col sm:flex-row gap-4">
                <FormField
                control={form.control}
                name="grupo"
                render={({ field }) => (
                    <FormItem className="flex-1">
                    <FormLabel>Grupo</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: 1234" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="cota"
                render={({ field }) => (
                    <FormItem className="flex-1">
                    <FormLabel>Cota</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: 567" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo do Ticket</FormLabel>
                  <Select onValueChange={handleReasonChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o motivo do seu contato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TICKET_REASONS.map(reason => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedReason && (
                    <FormDescription className="mt-2 text-destructive flex items-center gap-1.5">
                      <Info className="h-4 w-4" />
                      Previsão de resposta: {selectedReason.responseTime}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhe aqui sua solicitação ou problema. Este campo é obrigatório."
                      className="min-h-[120px] resize-y"
                      maxLength={MAX_OBSERVATIONS_LENGTH}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Máximo de {MAX_OBSERVATIONS_LENGTH} caracteres.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file" 
              render={({ fieldState }) => ( 
                <FormItem>
                  <FormLabel>Anexar Arquivos (Opcional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Input 
                          id="file-upload" 
                          type="file" 
                          multiple
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleFileChange}
                          accept={ALLOWED_FILE_TYPES.join(',')}
                        />
                        <Label 
                          htmlFor="file-upload"
                          className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-muted rounded-md cursor-pointer hover:border-primary transition-colors"
                        >
                          <UploadCloud className="h-6 w-6 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Clique para selecionar ou arraste os arquivos
                          </span>
                        </Label>
                    </div>
                  </FormControl>
                   <FormDescription>
                    Máximo de {MAX_FILES_COUNT} arquivos. Tamanho máximo por arquivo: 50MB.
                  </FormDescription>
                  {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
                  
                  {selectedFilesArray.length > 0 && (
                    <div className="space-y-2 pt-2">
                        <p className="text-sm font-medium text-muted-foreground">Arquivos selecionados:</p>
                        {selectedFilesArray.map((file, index) => (
                           <div key={index} className="flex items-center justify-between p-2 text-sm border rounded-md bg-muted/50">
                               <div className="flex items-center gap-2 truncate">
                                    <Paperclip className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{file.name}</span>
                               </div>
                               <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeFile(index)}>
                                   <X className="h-4 w-4" />
                               </Button>
                           </div>
                        ))}
                    </div>
                  )}

                </FormItem>
              )}
            />
            <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
              <Send className="mr-2 h-4 w-4" />
              {form.formState.isSubmitting ? "Enviando..." : "Enviar Ticket"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Seus dados serão tratados com confidencialidade. O tempo de resposta é uma estimativa e pode variar.
        </p>
      </CardFooter>
    </Card>
  );
}
