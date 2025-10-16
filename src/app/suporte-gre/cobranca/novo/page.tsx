
'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { diretores, gerentesPorDiretor, type Gerente } from '@/lib/cobrancaData';
import { FileText, Send, Loader2, Calendar, UploadCloud, Paperclip, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useCobrancaTickets } from '@/contexts/CobrancaTicketContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar'; // Renamed to avoid conflict
import { cn } from '@/lib/utils';
import { motivosCobranca } from '@/lib/cobrancaData';

const cobrancaTicketSchema = z.object({
    nome_cliente: z.string().min(1, { message: "Nome do cliente é obrigatório." }),
    cpf: z.string().min(14, { message: "CPF ou CNPJ inválido." }),
    cota: z.string().min(1, { message: "Número da cota é obrigatório." }),
    producao: z.date({
      required_error: "Data de venda é obrigatória.",
    }),
    telefone: z.string().min(14, { message: "Telefone inválido. Preencha o DDD e o número." }),
    email: z.string().email({ message: "Formato de e-mail inválido." }),
    diretor: z.string().min(1, { message: "Selecione um diretor." }),
    gerente: z.string().min(1, { message: "Selecione um gerente." }),
    vendedor: z.string().min(1, { message: "Nome do vendedor é obrigatório." }),
    motivo: z.string().min(1, { message: "Selecione um motivo." }),
    observacoes: z.string().optional(),
    files: z.custom<FileList>().optional(),
});

type CobrancaTicketFormData = z.infer<typeof cobrancaTicketSchema>;

export default function CobrancaPage() {
  const { toast } = useToast();
  const { user } = useAuth(); 
  const { addTicket: addCobrancaTicket, isLoading } = useCobrancaTickets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableGerentes, setAvailableGerentes] = useState<Gerente[]>([]);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    setCurrentDate(format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }));
  }, []);

  const form = useForm<CobrancaTicketFormData>({
    resolver: zodResolver(cobrancaTicketSchema),
    defaultValues: {
      nome_cliente: "",
      cpf: "",
      cota: "",
      telefone: "",
      email: "",
      diretor: "",
      gerente: "",
      vendedor: "",
      motivo: "",
      observacoes: "",
    },
  });

  const handleDiretorChange = (diretorName: string) => {
    const gerentes = gerentesPorDiretor[diretorName] || [];
    setAvailableGerentes(gerentes);
    form.setValue('gerente', '');
    form.setValue("diretor", diretorName, { shouldValidate: true });
  };


  const formatCpfCnpj = (value: string) => {
    const cleanedValue = value.replace(/\D/g, ''); 
  
    if (cleanedValue.length <= 11) {
      
      return cleanedValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      
      return cleanedValue
        .substring(0, 14) 
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
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


  async function onSubmit(data: CobrancaTicketFormData) {
    if (!user) {
        toast({
            title: "Erro de Autenticação",
            description: "Você precisa estar logado para criar um ticket.",
            variant: "destructive",
        });
        return;
    }
      
    setIsSubmitting(true);
    
    const success = await addCobrancaTicket({
        ...data,
        observacoes: data.observacoes || '',
        user_id: user.id,
        files: data.files ? Array.from(data.files) : undefined,
    });
    
    if (success) {
      form.reset();
      setAvailableGerentes([]);
    }
    
    setIsSubmitting(false);
  }
  
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


  return (
    <div className="py-8">
       <Card className="w-full max-w-4xl mx-auto shadow-xl">
            <CardHeader>
                <CardTitle className="font-headline text-3xl text-primary flex items-center gap-2">
                <FileText className="h-8 w-8" /> Ticket de Apoio ao Comercial
                </CardTitle>
                <CardDescription>
                Preencha os campos abaixo para abrir uma nova solicitação de apoio.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4 p-4 border rounded-md">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-semibold text-lg text-primary">Identificação do Atendimento</h3>
                            <div className="space-y-2 text-right">
                                <Label htmlFor="data_atend" className="flex items-center gap-1.5 text-xs text-muted-foreground justify-end"><Calendar className="h-4 w-4" /> Data do Atendimento</Label>
                                <Input
                                    id="data_atend"
                                    value={currentDate}
                                    disabled
                                    className="cursor-not-allowed bg-muted/50 h-8 w-[150px] text-center text-xs"
                                />
                            </div>
                        </div>
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
                                    <FormLabel>CPF ou CNPJ</FormLabel>
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
                                name="cota"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Número da Cota</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Cota" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="producao"
                                render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Data de Venda</FormLabel>
                                    <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                            format(field.value, "PPP", { locale: ptBR })
                                            ) : (
                                            <span>Escolha uma data</span>
                                            )}
                                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <CalendarComponent
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
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
                                name="telefone"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Telefone</FormLabel>
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
                                    <FormLabel>E-mail</FormLabel>
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
                        <h3 className="font-semibold text-lg text-primary">Responsáveis pelo Cliente</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField
                                control={form.control}
                                name="diretor"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Diretor Responsável</FormLabel>
                                    <Select onValueChange={handleDiretorChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Selecione o diretor" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {diretores.map(d => (
                                        <SelectItem key={d.name} value={d.name}>
                                            {d.name}
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="gerente"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Gerente Responsável</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={availableGerentes.length === 0}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Selecione o gerente" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {availableGerentes.map(g => (
                                        <SelectItem key={g.name} value={g.name}>
                                            {g.name}
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="vendedor"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nome do Vendedor</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nome do vendedor" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold text-lg text-primary">Detalhes da Solicitação</h3>
                         <FormField
                            control={form.control}
                            name="motivo"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Motivo da Solicitação</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Selecione o motivo" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {motivosCobranca.map(m => (
                                    <SelectItem key={m} value={m}>
                                        {m}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="observacoes"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Observações do Atendimento</FormLabel>
                                <FormControl>
                                    <Textarea
                                    placeholder="Detalhes do atendimento, histórico do cliente, informações adicionais..."
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
                    <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || isLoading}>
                        {(isSubmitting || isLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        {(isSubmitting || isLoading) ? "Enviando..." : "Enviar Solicitação"}
                    </Button>
                </form>
                </Form>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">
                As informações registradas serão usadas para a análise da solicitação de apoio ao comercial.
                </p>
            </CardFooter>
        </Card>
    </div>
  );
}

    
    

    