'use client';

import { useState, type ChangeEvent, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Send, Loader2, Paperclip, UploadCloud, X, Milestone, CalendarIcon } from 'lucide-react';
import { usePosContemplacaoTickets } from '@/contexts/PosContemplacaoTicketContext';
import { useAuth } from '@/contexts/AuthContext';
import { MOTIVOS_POS_CONTEMPLACAO, RESPONSAVEIS } from '@/lib/posContemplacaoData';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const posContemplacaoSchema = z.object({
    nome_cliente: z.string().min(1, "Nome do cliente é obrigatório."),
    cpf: z.string().optional(),
    grupo: z.string().min(1, "Grupo é obrigatório."),
    cota: z.string().min(1, "Cota é obrigatória."),
    telefone: z.string().optional(),
    email: z.string().optional(),
    relator: z.string().min(1, "Relator é obrigatório."),
    responsavel: z.string().min(1, "Responsável é obrigatório."),
    motivo: z.string().min(1, "Motivo é obrigatório."),
    susep: z.string().optional(),
    data_limite: z.date({
      required_error: "A data limite de resposta é obrigatória.",
    }),
    observacoes: z.string().optional(),
    files: z.custom<FileList>().optional(),
});

type PosContemplacaoFormData = z.infer<typeof posContemplacaoSchema>;

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

    if (length <= 2) {
      return `(${cleanedValue}`;
    } 
    
    let formatted = `(${cleanedValue.substring(0, 2)}) `;

    if (length <= 6) {
        return formatted + cleanedValue.substring(2);
    }
    
    if (length <= 10) {
        return formatted + `${cleanedValue.substring(2, 6)}-${cleanedValue.substring(6)}`;
    }

    return formatted + `${cleanedValue.substring(2, 7)}-${cleanedValue.substring(7, 11)}`;
};

export default function NovoTicketPosContemplacaoPage() {
  const { addTicket, isLoading } = usePosContemplacaoTickets();
  const { username, email: userEmail } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<PosContemplacaoFormData>({
    resolver: zodResolver(posContemplacaoSchema),
    defaultValues: {
      nome_cliente: "",
      cpf: "",
      grupo: "",
      cota: "",
      telefone: "",
      email: "",
      relator: "",
      responsavel: "",
      motivo: "",
      susep: "",
      observacoes: "",
    },
  });
  
  useEffect(() => {
    if(username) {
      form.setValue('relator', username);
    }
  }, [username, form]);

  const selectedFiles = form.watch("files");
  const selectedFilesArray = selectedFiles ? Array.from(selectedFiles) : [];

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
        form.setValue("files", files, { shouldValidate: true });
    }
  };

  const removeFile = (indexToRemove: number) => {
    const currentFiles = selectedFilesArray;
    const updatedFiles = currentFiles.filter((_, index) => index !== indexToRemove);
    const dataTransfer = new DataTransfer();
    updatedFiles.forEach(file => dataTransfer.items.add(file));
    form.setValue("files", dataTransfer.files, { shouldValidate: true });
  };

  async function onSubmit(data: PosContemplacaoFormData) {
    setIsSubmitting(true);
    
    if (!userEmail) {
        toast({
            title: "Erro de autenticação",
            description: "Não foi possível identificar o seu e-mail de usuário.",
            variant: "destructive"
        });
        setIsSubmitting(false);
        return;
    }
    
    const success = await addTicket({
        ...data,
        cpf: data.cpf || '',
        relator: userEmail,
        observacoes: data.observacoes || '',
        data_limite: data.data_limite.toISOString(),
        telefone: data.telefone || undefined,
        email: data.email || undefined,
        susep: data.susep || '',
    }, data.files ? Array.from(data.files) : undefined);
    
    if (success) {
      form.reset();
      if (username) {
        form.setValue('relator', username);
      }
    }
    
    setIsSubmitting(false);
  }

  return (
    <div className="py-8">
       <Card className="w-full max-w-4xl mx-auto shadow-xl">
            <CardHeader>
                <CardTitle className="font-headline text-3xl text-primary flex items-center gap-2">
                <Milestone className="h-8 w-8" /> Ticket de Pós-Contemplação
                </CardTitle>
                <CardDescription>
                Preencha os campos abaixo para abrir uma nova solicitação para o setor de Pós-Contemplação.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold text-lg text-primary">Informações do Cliente</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="nome_cliente"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Nome Completo do Cliente</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nome do cliente" {...field} />
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
                                    <FormLabel>CPF ou CNPJ (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input 
                                          placeholder="000.000.000-00" 
                                          {...field}
                                          onChange={(e) => field.onChange(formatCpfCnpj(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="grupo"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Grupo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="0000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cota"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Cota</FormLabel>
                                    <FormControl>
                                        <Input placeholder="000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="telefone"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Telefone (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input 
                                          type="tel" 
                                          placeholder="(00) 00000-0000" 
                                          {...field}
                                          onChange={(e) => field.onChange(formatPhone(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>E-mail (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input 
                                          type="email" 
                                          placeholder="cliente@email.com" 
                                          {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold text-lg text-primary">Detalhes da Solicitação</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <FormField
                              control={form.control}
                              name="relator"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Relator</FormLabel>
                                   <FormControl>
                                      <Input value={username || 'Carregando...'} disabled />
                                   </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="responsavel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Responsável</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione o responsável" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {RESPONSAVEIS.map(item => (
                                        <SelectItem key={item.email} value={item.email}>{item.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <FormField
                              control={form.control}
                              name="motivo"
                              render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Motivo da Solicitação</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o motivo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {MOTIVOS_POS_CONTEMPLACAO.map(motivo => (
                                      <SelectItem key={motivo} value={motivo}>{motivo}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                  <FormMessage />
                              </FormItem>
                              )}
                          />
                          <FormField
                            control={form.control}
                            name="susep"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SUSEP (Opcional)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o SUSEP" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="3SQ64J">3SQ64J</SelectItem>
                                    <SelectItem value="R05KPJ">R05KPJ</SelectItem>
                                    <SelectItem value="5194SJ">5194SJ</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                         <FormField
                            control={form.control}
                            name="observacoes"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Observações</FormLabel>
                                <FormControl>
                                    <Textarea
                                    placeholder="Detalhes da solicitação, informações importantes, etc."
                                    className="min-h-[120px] resize-y"
                                    {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="data_limite"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Data Limite de Resposta</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-[240px] pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP", { locale: ptBR })
                                        ) : (
                                            <span>Escolha uma data</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date < new Date(new Date().toDateString())
                                        }
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                         <FormField
                            control={form.control}
                            name="files" 
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
                    </div>
                    <div className="flex gap-4">
                        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || isLoading}>
                            {(isSubmitting || isLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            {(isSubmitting || isLoading) ? "Enviando..." : "Enviar Solicitação"}
                        </Button>
                    </div>
                </form>
                </Form>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">
                As informações registradas serão usadas para a análise da solicitação de pós-contemplação.
                </p>
            </CardFooter>
        </Card>
    </div>
  );
}

    