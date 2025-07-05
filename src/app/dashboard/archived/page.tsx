'use client';

import { ArchivedTicketsClient } from "@/components/ArchivedTicketsClient";
import { useAuth } from "@/contexts/AuthContext";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ArchivedTicketsPage() {
    const { cargo, isLoading } = useAuth();

    if (isLoading) {
        return (
          <div className="space-y-6">
            <Skeleton className="h-10 w-1/3" />
             <div className="flex flex-col lg:flex-row gap-2 items-center w-full p-4 bg-card border rounded-lg shadow">
              <Skeleton className="h-10 w-full lg:flex-grow" />
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto items-center shrink-0">
                <Skeleton className="h-10 w-full sm:w-[180px]" />
                <Skeleton className="h-10 w-full sm:w-[180px]" />
                <Skeleton className="h-10 w-20 hidden sm:block" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-lg" />)}
            </div>
          </div>
        );
    }

    if (cargo !== 'adm') {
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
        <h1 className="text-3xl font-bold font-headline mb-6 text-primary">Tickets Arquivados</h1>
        <ArchivedTicketsClient />
        </div>
    );
}
