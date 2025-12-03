
'use client';

import { ArchivedPosContemplacaoTicketsClient } from "@/components/ArchivedPosContemplacaoTicketsClient";
import { useAuth } from "@/contexts/AuthContext";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ArchivedPosContemplacaoTicketsPage() {
    const { cargo, email } = useAuth();
    const allowedRoles = ['adm', 'greadmin', 'gre_con', 'gre_con_admin'];
    const allowedEmails = new Set([
      'luana.pereira@portovaleconsorcios.com.br',
      'mayara.paulino@portovaleconsorcios.com.br',
    ]);
    const canViewManagement = (cargo && allowedRoles.includes(cargo)) || (email ? allowedEmails.has(email.toLowerCase()) : false);

    if (!canViewManagement) {
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold font-headline text-[#334155]">Pós-Contemplação - Arquivados</h1>
          </div>
          <ArchivedPosContemplacaoTicketsClient />
        </div>
    );
}
