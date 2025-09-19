
'use client';

import Link from 'next/link';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CobrancaGestaoClient } from '@/components/CobrancaGestaoClient';

export default function GestaoApoioCobrancaPage() {
  const { cargo } = useAuth();
  const allowedRoles = ['adm', 'greadmin', 'gre_apoio_admin'];

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
              Você não tem permissão para visualizar este serviço.
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
    <div>
      <h1 className="text-3xl font-bold font-headline mb-6 text-primary">Gestão de Apoio Jacareí</h1>
      <CobrancaGestaoClient />
    </div>
  );
}
