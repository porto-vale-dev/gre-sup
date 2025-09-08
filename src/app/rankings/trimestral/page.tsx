
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TrimestralPage() {
  const { cargo } = useAuth();
  const allowedRoles = ['adm', 'diretor', 'greadmin'];

  if (!cargo || !allowedRoles.includes(cargo)) {
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
              Você não tem permissão para visualizar este ranking.
            </p>
            <Button asChild>
              <Link href="/rankings">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar aos Rankings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-10rem)]">
      <div>
        <Link href="/rankings" passHref>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Rankings
          </Button>
        </Link>
      </div>
      <div className="relative flex-grow rounded-lg shadow-lg border overflow-hidden">
        <iframe
          title="Ranking Trimestral"
          src="https://app.powerbi.com/view?r=eyJrIjoiNGI0Yzg4YmUtN2I2OS00ZjkwLWEwMWUtZWFhNWRjNGM4ZWQ3IiwidCI6IjUzNDU4MDVjLTNiZjQtNDgzNS05YTc5LWQxNzVkOTEyZjljYyJ9"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full border-0"
        ></iframe>
      </div>
    </div>
  );
}
