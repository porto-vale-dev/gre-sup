
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileUp, Paperclip } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface UploadDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subCategory: 'Relatórios Gerais' | 'Comex Board' | string;
  onUploadSuccess: () => void;
}

const BUCKET_NAME = 'documentos';

const months = [
    { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' }
];

const getYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 2; i <= currentYear + 3; i++) {
    years.push({ value: i.toString(), label: i.toString() });
  }
  return years;
};

export function UploadDocumentDialog({ isOpen, onClose, subCategory, onUploadSuccess }: UploadDocumentDialogProps) {
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      if(event.target.files[0].type !== 'application/pdf') {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo PDF.",
          variant: "destructive",
        });
        event.target.value = '';
        setFile(null);
        return;
      }
      setFile(event.target.files[0]);
    }
  };

  const namePrefix = subCategory === 'Relatórios Gerais' ? 'Comex' : 'BOARD';
  const pathPrefix = subCategory === 'Relatórios Gerais' ? 'comex/' : 'comex/comex_board/';
  const finalFileName = file && month && year ? `${namePrefix}_${month}${year.slice(-2)}.pdf` : "Selecione mês, ano e arquivo";

  const handleSave = async () => {
    if (!file || !month || !year) {
      toast({
        title: "Campos Incompletos",
        description: "Por favor, preencha todos os campos e selecione um arquivo.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    const filePathInBucket = `${pathPrefix}${finalFileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePathInBucket, file, {
          cacheControl: '3600',
          upsert: true, // This will overwrite the file if it already exists
        });

      if (uploadError) {
        throw uploadError;
      }

      toast({
        title: "Upload bem-sucedido!",
        description: `O arquivo ${finalFileName} foi salvo.`,
      });
      onUploadSuccess();
      // Reset state after successful upload
      setMonth('');
      setYear('');
      setFile(null);
      onClose(); // Close the dialog on success
      
    } catch (error: any) {
        toast({
          title: "Erro no Upload",
          description: `Não foi possível salvar o arquivo. Verifique se o bucket 'documentos' permite uploads e se as permissões (RLS) estão corretas. Detalhes: ${error.message}`,
          variant: "destructive",
        });
        console.error("Upload error:", error);
    } finally {
        setIsLoading(false);
    }
  };
  
  const years = getYears();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Documento</DialogTitle>
          <DialogDescription>
            Faça o upload de um novo relatório para a categoria "{subCategory}".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome Padrão
            </Label>
            <Input id="name" value={namePrefix} disabled className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="month" className="text-right">
              Mês
            </Label>
            <Select onValueChange={setMonth} value={month}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                    {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">
              Ano
            </Label>
             <Select onValueChange={setYear} value={year}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                    {years.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-start gap-4">
             <Label htmlFor="file-upload" className="text-right pt-2">
              Arquivo
            </Label>
             <div className="col-span-3">
                 <Input 
                    id="file-upload" 
                    type="file" 
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="mb-2"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Paperclip className="h-3 w-3" />
                    Nome final: <strong>{finalFileName}</strong>
                </p>
             </div>
           </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isLoading || !file || !month || !year}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
