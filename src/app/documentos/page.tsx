
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { documentsData } from '@/lib/documentsData';
import type { Document } from '@/lib/documentsData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Landmark, Folder, ArrowLeft, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';


const DocumentCard = ({ document, onPreview }: { document: Document; onPreview: (url: string) => void }) => (
  <Card className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
    <CardHeader>
      <CardTitle className="text-lg">{document.title}</CardTitle>
    </CardHeader>
    <CardContent className="flex-grow">
      <CardDescription>{document.description}</CardDescription>
    </CardContent>
    <CardFooter className="gap-2 pt-4">
      <Button variant="outline" className="w-full" onClick={() => onPreview(document.previewUrl)}>
        Visualizar
      </Button>
      <Button asChild variant="secondary" className="w-full">
        <Link href={document.downloadUrl} download>Download</Link>
      </Button>
    </CardFooter>
  </Card>
);

export default function DocumentosPage() {
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('Todos');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const filteredDocuments = useMemo(() => {
    if (selectedSubCategory === 'Todos') {
      return documentsData;
    }
    if (selectedSubCategory === 'Financeiro') {
      return documentsData.filter(doc => doc.category === 'Financeiro');
    }
    return documentsData.filter(doc => doc.subCategory === selectedSubCategory);
  }, [selectedSubCategory]);

  const financialSubcategories = useMemo(() => {
    const subCategories = documentsData
        .filter(doc => doc.category === 'Financeiro')
        .map(doc => ({ name: doc.subCategory, Icon: doc.Icon }));
    return subCategories.filter((item, index, self) => 
        index === self.findIndex((t) => t.name === item.name)
    );
  }, []);

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
  };

  const handleClosePreview = () => {
    setPreviewUrl(null);
  };

  const getPreviewTitle = () => {
    if (!previewUrl) return '';
    const doc = documentsData.find(d => d.previewUrl === previewUrl);
    return doc ? doc.title : 'Visualização de Documento';
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
      {/* Sidebar */}
      <aside className="w-full md:w-64 lg:w-72 shrink-0">
        <div className="sticky top-24 space-y-6">
            <Link href="/hub" passHref>
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
                    <Accordion type="single" collapsible defaultValue="financeiro" className="w-full">
                    <AccordionItem value="financeiro" className="border-b-0">
                        <AccordionTrigger
                          onClick={() => setSelectedSubCategory('Financeiro')}
                          className={cn(
                            "py-2 px-3 rounded-md text-base no-underline",
                            selectedSubCategory === 'Financeiro'
                                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                : "hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2 font-medium">
                              <Landmark className="h-4 w-4" /> Financeiro
                          </div>
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
                                <Icon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="leading-tight">{name}</span>
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

      {/* Main Content */}
      <main className="flex-1">
            <h1 className="text-3xl font-bold font-headline mb-8 text-primary">
              {selectedSubCategory === 'Todos' ? 'Todos os Documentos' : selectedSubCategory}
            </h1>
            {filteredDocuments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredDocuments.map(doc => (
                        <DocumentCard key={doc.title} document={doc} onPreview={handlePreview} />
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

      {/* Preview Modal */}
      <Dialog open={!!previewUrl} onOpenChange={(isOpen) => !isOpen && handleClosePreview()}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{getPreviewTitle()}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 px-6 pb-6 overflow-hidden">
            <object
              data={previewUrl!}
              type="application/pdf"
              className="w-full h-full rounded-md border"
            >
              <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center bg-muted/50 rounded-md">
                <p className="text-lg font-semibold text-destructive">Seu navegador não suporta a visualização de PDFs.</p>
                <p className="text-muted-foreground">Você ainda pode baixar o arquivo.</p>
                <Button asChild>
                    <a href={previewUrl!} download>Baixar PDF</a>
                </Button>
              </div>
            </object>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
