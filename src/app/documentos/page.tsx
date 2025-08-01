
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { documentsData } from '@/lib/documentsData';
import type { Document } from '@/lib/documentsData';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Landmark, Folder, ArrowLeft, FileText, Download, Loader2, Eye, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const BUCKET_NAME = 'documentos';

const DocumentCard = ({
  document,
  onPreview,
  onDownload,
  isLoadingPreview,
  isLoadingDownload
}: {
  document: Document;
  onPreview: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  isLoadingPreview: boolean;
  isLoadingDownload: boolean;
}) => {
  return (
    <Card className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{document.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription>{document.description}</CardDescription>
      </CardContent>
      <CardFooter className="gap-2 pt-4">
        <Button variant="outline" className="w-full" onClick={() => onPreview(document)} disabled={isLoadingPreview || isLoadingDownload}>
          {isLoadingPreview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
          Visualizar
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => onDownload(document)} disabled={isLoadingPreview || isLoadingDownload}>
          {isLoadingDownload ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Download
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function DocumentosPage() {
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('Todos');
  const [accordionValue, setAccordionValue] = useState<string | undefined>();
  const [loadingState, setLoadingState] = useState<{ id: string | null; type: 'preview' | 'download' | null }>({ id: null, type: null });
  const { toast } = useToast();

  const handlePreview = async (doc: Document) => {
    setLoadingState({ id: doc.pathInBucket, type: 'preview' });
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(doc.pathInBucket, 300); // 5 minute link

      if (error || !data?.signedUrl) {
        throw error ?? new Error('URL inválida ou não gerada.');
      }
      
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');

    } catch (error: any) {
      toast({
        title: "Erro ao Gerar Visualização",
        description: `Não foi possível criar o link. Verifique se o caminho do arquivo está correto e as permissões do bucket no Supabase. Erro: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoadingState({ id: null, type: null });
    }
  };

  const handleDownload = async (doc: Document) => {
    setLoadingState({ id: doc.pathInBucket, type: 'download' });
    try {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).download(doc.pathInBucket);
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Download Iniciado", description: `Baixando ${doc.fileName}...` });
    } catch (error: any) {
      toast({
        title: "Erro no Download",
        description: `Não foi possível baixar o arquivo. Verifique se o caminho está correto e as permissões do bucket. Erro: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoadingState({ id: null, type: null });
    }
  };
  
  const filteredDocuments = useMemo(() => {
    if (selectedSubCategory === 'Todos') return documentsData;
    if (selectedSubCategory === 'Financeiro') return documentsData.filter(doc => doc.category === 'Financeiro');
    return documentsData.filter(doc => doc.subCategory === selectedSubCategory);
  }, [selectedSubCategory]);

  const financialSubcategories = useMemo(() => {
    const subCategories = documentsData
      .filter(doc => doc.category === 'Financeiro')
      .map(doc => ({ name: doc.subCategory, Icon: doc.Icon }));
    return subCategories.filter((item, index, self) =>
      index === self.findIndex(t => t.name === item.name)
    );
  }, []);

  const getTitle = (sub: string) => {
    if (sub === 'Todos') return 'Todos os Documentos';
    if (sub === 'Financeiro') return 'Documentos Financeiros';
    return `Documentos - ${sub}`;
  };

  const handleAccordionTriggerClick = () => {
    setAccordionValue(current => (current === 'financeiro' ? undefined : 'financeiro'));
    setSelectedSubCategory('Financeiro');
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
      {/* Sidebar */}
      <aside className="w-full md:w-64 lg:w-72 shrink-0">
        <div className="sticky top-24 space-y-6">
          <Link href="/hub">
            <Button variant="outline" size="sm" className="w-full justify-start text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Hub
            </Button>
          </Link>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight px-2">Documentos</h2>
            <div className="flex flex-col gap-1">
              <Button
                variant={selectedSubCategory === 'Todos' ? 'secondary' : 'ghost'}
                className="justify-start"
                onClick={() => setSelectedSubCategory('Todos')}
              >
                <Folder className="mr-2 h-4 w-4" /> Todos
              </Button>

              <Accordion
                type="single"
                collapsible
                value={accordionValue}
                onValueChange={setAccordionValue}
                className="w-full"
              >
                <AccordionItem value="financeiro" className="border-b-0">
                    <AccordionTrigger
                        onClick={() => setSelectedSubCategory('Financeiro')}
                        className={cn(
                            "py-2 px-3 rounded-md text-base font-medium no-underline hover:no-underline",
                            selectedSubCategory === 'Financeiro' || financialSubcategories.some(sub => sub.name === selectedSubCategory)
                                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                : "hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                      <div className="flex items-center gap-2">
                        <Landmark className="h-4 w-4" /> Financeiro
                      </div>
                      <ChevronRight data-no-animation className={cn("h-4 w-4 shrink-0 transition-transform duration-200", accordionValue === 'financeiro' && "rotate-90")} />
                  </AccordionTrigger>
                  <AccordionContent className="pl-4 pt-1">
                    <div className="flex flex-col gap-1">
                      {financialSubcategories.map(({ name, Icon }) => (
                        <Button
                          key={name}
                          variant={selectedSubCategory === name ? 'secondary' : 'ghost'}
                          className="justify-start h-auto py-1.5 px-2 text-left text-sm font-normal"
                          onClick={() => setSelectedSubCategory(name)}
                        >
                          {(Icon ? <Icon /> : <Folder />)}
                          <span className="ml-2 leading-tight">{name}</span>
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1">
        <h1 className="text-3xl font-bold font-headline mb-8 text-primary">
          {getTitle(selectedSubCategory)}
        </h1>

        {filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDocuments.map(doc => (
              <DocumentCard
                key={doc.pathInBucket}
                document={doc}
                onPreview={handlePreview}
                onDownload={handleDownload}
                isLoadingPreview={loadingState.id === doc.pathInBucket && loadingState.type === 'preview'}
                isLoadingDownload={loadingState.id === doc.pathInBucket && loadingState.type === 'download'}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center bg-card border rounded-lg p-8 h-64">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">Nenhum Documento</h3>
            <p className="text-muted-foreground mt-1">Não há documentos para exibir nesta categoria.</p>
          </div>
        )}
      </main>

    </div>
  );
}
