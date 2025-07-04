
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
// TicketFile type is now mainly for display, raw File object is used for submission
import { useTickets } from '@/contexts/TicketContext';
import { useToast } from "@/hooks/use-toast";
import { FileText, Info, Send, Paperclip, UploadCloud, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// readFileAsDataURL is no longer needed as we directly upload the File object

export function TicketForm() {
  const [selectedReason, setSelectedReason] = useState<(typeof TICKET_REASONS)[0] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Store the selected File object
  const { addTicket } = useTickets();
  const { toast } = useToast();

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      name: "",
      phone: "",
      reason: "",
      observations: "",
      // file: undefined, // Zod schema handles this. We'll use selectedFile state.
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
      if (file.size > MAX_FILE_SIZE) {
        form.setError("file", { type: "manual", message: `Tamanho máximo do arquivo é ${MAX_FILE_SIZE / 1024 / 1024}MB.` });
        setFileName(null);
        setSelectedFile(null);
        event.target.value = ""; 
        return;
      }
      const isAllowedType = ALLOWED_FILE_TYPES.includes(file.type) || ALLOWED_FILE_TYPES.some(ext => file.name.toLowerCase().endsWith(ext.toLowerCase()));
      if (!isAllowedType && !file.name.match(/\.(pdf|doc|docx|txt|xls|xlsx|csv|jpg|jpeg|png|gif)$/i) ) {
         form.setError("file", { type: "manual", message: "Tipo de arquivo inválido." });
         setFileName(null);
         setSelectedFile(null);
         event.target.value = ""; 
        return;
      }
      form.clearErrors("file");
      setFileName(file.name);
      setSelectedFile(file); // Store the File object
    } else {
      setFileName(null);
      setSelectedFile(null);
    }
  };

  async function onSubmit(data: TicketFormData) {
    const ticketPayload = {
      name: data.name,
      phone: data.phone,
      reason: data.reason,
      estimated_response_time: selectedReason?.responseTime || "N/A",
      observations: data.observations,
      file: selectedFile || undefined, // Pass the File object to addTicket
    };

    const success = await addTicket(ticketPayload);

    if (success) {
      form.reset();
      setSelectedReason(null);
      setFileName(null);
      setSelectedFile(null);
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
              name="file" // Still needed for Zod validation linking
              render={({ fieldState }) => ( // Only need fieldState for error display
                <FormItem>
                  <FormLabel>Anexar Arquivo (Opcional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Input 
                          id="file-upload" 
                          type="file" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleFileChange} // Uses custom handler
                          // onBlur, name, ref are not directly used from RHF for file input
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
                    Tipos permitidos: PDF, DOC(X), TXT, XLS(X), CSV, Imagens (JPG, PNG, GIF). Tamanho máx: 5MB.
                  </FormDescription>
                  {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
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
