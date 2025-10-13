
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CampanhaPage() {
  const { cargo } = useAuth();
  const allowedRoles = ['adm', 'greadmin', 'greadminsa', 'diretor', 'gerente', 'gerente1', 'gre', 'grea', 'gre_con', 'gre_con_admin', 'gre_apoio_admin', 'gre_apoio', 'colaborador'];

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
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/rankings" passHref>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Rankings
          </Button>
        </Link>
      </div>

      <div className="space-y-12">
        {/* First Report */}
        <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2 text-primary">
                <Trophy className="h-6 w-6"/>
                Ranking Campanha - Day Use Hotel Fazenda
            </h2>
            <div className="relative flex-grow rounded-lg shadow-lg border overflow-hidden h-[calc(100vh-18rem)] min-h-[600px]">
                <iframe
                title="Ranking Day Use Hotel Fazenda"
                src="https://app.powerbi.com/view?r=eyJrIjoiMDk5YWVjYzQtM2YxMi00OTQ4LTg0NmEtOTk4ZDY1YjhmY2QzIiwidCI6IjUzNDU4MDVjLTNiZjQtNDgzNS05YTc5LWQxNzVkOTEyZjljYyJ9"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full border-0"
                ></iframe>
            </div>
        </div>

        {/* Second Report */}
         <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2 text-primary">
                <Trophy className="h-6 w-6"/>
                Ranking Campanha - Zeca Pagodinho
            </h2>
            <div className="relative flex-grow rounded-lg shadow-lg border overflow-hidden h-[calc(100vh-18rem)] min-h-[600px]">
                <iframe
                title="Ranking Campanha Zeca Pagodinho"
                src="https://app.powerbi.com/view?r=eyJrIjoiNTAwMTM0MmEtZjllYy00NWVkLWIxODQtNmQwNWE3YjhmNjJjIiwidCI6IjUzNDU4MDVjLTNiZjQtNDgzNS05YTc5LWQxNzVkOTEyZjljYyJ9"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full border-0"
                ></iframe>
            </div>
        </div>
      </div>
    </div>
  );
}
