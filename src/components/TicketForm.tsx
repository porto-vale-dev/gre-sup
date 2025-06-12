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
import { TICKET_REASONS, ALLOWED_FILE_TYPES, MAX_FILE_SIZE, MAX_OBSERVATIONS_LENGTH } from '@/lib/constants';
import { useTickets } from '@/contexts/TicketContext';
import { useToast } from "@/hooks/use-toast";
import { FileText, Info, Send, Paperclip, UploadCloud } from 'lucide-react';

export function TicketForm() {
  const [selectedReason, setSelectedReason] = useState<(typeof TICKET_REASONS)[0] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const { addTicket } = useTickets();
  const { toast } = useToast();

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      name: "",
      phone: "",
      reason: "",
      observations: "",
    },
  });

  const handleReasonChange = (value: string) => {
    const reason = TICKET_REASONS.find(r => r.value === value) || null;
    setSelectedReason(reason);
    form.setValue("reason", value);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size client-side before setting in form
      if (file.size > MAX_FILE_SIZE) {
        form.setError("file", { type: "manual", message: `Tamanho máximo do arquivo é ${MAX_FILE_SIZE / 1024 / 1024}MB.` });
        setFileName(null);
        event.target.value = ""; // Clear the input
        return;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type) && !ALLOWED_FILE_TYPES.some(ext => file.name.endsWith(ext))) {
         form.setError("file", { type: "manual", message: "Tipo de arquivo inválido." });
         setFileName(null);
         event.target.value = ""; // Clear the input
        return;
      }
      form.clearErrors("file"); // Clear any previous error
      setFileName(file.name);
    } else {
      setFileName(null);
    }
  };

  function onSubmit(data: TicketFormData) {
    const file = data.file?.[0];
    const ticketData = {
      name: data.name,
      phone: data.phone,
      reason: data.reason,
      estimatedResponseTime: selectedReason?.responseTime || "N/A",
      observations: data.observations,
      file: file ? { name: file.name, type: file.type, size: file.size } : undefined,
    };
    addTicket(ticketData);
    toast({
      title: "Ticket Enviado com Sucesso!",
      description: "Seu ticket foi registrado e será processado em breve.",
      variant: "default",
    });
    form.reset();
    setSelectedReason(null);
    setFileName(null);
    // Clear file input visually if possible (target.value = "" in change handler helps)
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-primary flex items-center gap-2">
          <FileText className="h-8 w-8" /> Abrir Novo Ticket
        </CardTitle>
        <CardDescription>Preencha o formulário abaixo para registrar seu chamado.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
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
                    <FormDescription className="mt-2 text-accent flex items-center gap-1.5">
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
                  <FormLabel>Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhe aqui sua solicitação ou problema..."
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
              render={({ field: { onChange, onBlur, name, ref }}) => (
                <FormItem>
                  <FormLabel>Anexar Arquivo (Opcional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Input 
                          id="file-upload" 
                          type="file" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => {
                            onChange(e.target.files); // RHF expects FileList
                            handleFileChange(e);
                          }}
                          onBlur={onBlur} 
                          name={name} 
                          ref={ref}
                          accept={ALLOWED_FILE_TYPES.join(',')}
                        />
                        <Label 
                          htmlFor="file-upload"
                          className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-muted rounded-md cursor-pointer hover:border-primary transition-colors"
                        >
                          <UploadCloud className="h-6 w-6 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {fileName ? fileName : "Clique para selecionar ou arraste um arquivo"}
                          </span>
                        </Label>
                    </div>
                  </FormControl>
                  {fileName && (
                    <FormDescription className="mt-2 text-primary flex items-center gap-1.5">
                        <Paperclip className="h-4 w-4" /> Arquivo selecionado: {fileName}
                    </FormDescription>
                  )}
                  <FormDescription>
                    Tipos permitidos: PDF, DOC(X), TXT, XLS(X), CSV, Imagens. Tamanho máx: 5MB.
                  </FormDescription>
                  <FormMessage />
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
