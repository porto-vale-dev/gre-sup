
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Expand, Shrink, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MuralDeAvisosPage() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { username } = useAuth();

  // Se o usuário for 'diretor01', bloqueie o acesso.
  if (username === 'diretor01') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardHeader>
            <div className="mx-auto bg-destructive/10 text-destructive p-4 rounded-full w-fit">
                <ShieldAlert className="h-12 w-12" />
            </div>
            <CardTitle className="font-headline text-2xl text-destructive mt-4">
                Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Você não tem permissão para visualizar esta página.
            </p>
            <Button asChild>
              <Link href="/hub">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o Hub
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 h-[calc(100vh-12rem)] transition-all duration-300",
        isExpanded && "fixed inset-0 z-50 bg-background p-4 h-screen"
      )}
    >
      <div className="flex items-center justify-between">
        <Link href="/hub" passHref>
          <Button variant="outline" size="sm" className={cn(isExpanded && "hidden")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Hub
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-auto"
        >
          {isExpanded ? (
            <>
              <Shrink className="mr-2 h-4 w-4" /> Recolher
            </>
          ) : (
            <>
              <Expand className="mr-2 h-4 w-4" /> Expandir
            </>
          )}
        </Button>
      </div>

      <div className="relative flex-grow rounded-lg shadow-lg border overflow-hidden bg-white">
        <iframe
          title="Mural de Avisos"
          src="https://portovaleconsorcio.notion.site/ebd/95f9598f275c4089a845baa835679814"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full border-0"
        ></iframe>
      </div>
    </div>
  );
}
