
"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Users, Target, Award, ArrowRight, ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Service {
  title: string;
  href: string;
  Icon: LucideIcon;
  description: string;
  allowedRoles: string[]; 
}

// Definição das permissões para cada card de acordo com a nova lógica
const allRankingServices: Service[] = [
  { title: "Ranking Diretor", href: "/rankings/diretor", Icon: Crown, description: "Visualize o ranking de diretores.", allowedRoles: ["adm", "diretor", "greadmin"] },
  { title: "Ranking Gerente", href: "/rankings/gerente", Icon: Users, description: "Acompanhe o desempenho dos gerentes.", allowedRoles: ["adm", "diretor", "gerente", "greadmin"] },
  { title: "Ranking Campanha", href: "/rankings/campanha", Icon: Target, description: "Confira os resultados da campanha atual.", allowedRoles: ["adm", "diretor", "gerente", "colaborador", "greadmin"] },
  { title: "Ranking Trimestral", href: "/rankings/trimestral", Icon: Award, description: "Veja o balanço do trimestre.", allowedRoles: ["adm", "diretor", "greadmin"] },
];

const ServiceCard = ({ service }: { service: Service }) => (
  <Link href={service.href} className="group block">
    <Card className="h-full hover:border-primary hover:shadow-lg transition-all duration-300 flex flex-col">
      <CardContent className="p-6 flex flex-col items-start gap-4 flex-grow">
        <div className="flex justify-between items-center w-full">
            <div className="bg-primary/10 text-primary p-3 rounded-lg">
                <service.Icon className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-card-foreground">{service.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
        </div>
      </CardContent>
    </Card>
  </Link>
);

export default function RankingsPage() {
    const { cargo } = useAuth(); 
    
    // Filtra a lista de serviços com base no cargo do usuário
    const accessibleServices = useMemo(() => {
      // Trata usuários com cargo nulo, vazio ou indefinido como "colaborador"
      const userRole = cargo || 'colaborador';
      return allRankingServices.filter(service => service.allowedRoles.includes(userRole));
    }, [cargo]);
    
    return (
        <div className="space-y-8">
            <Link href="/hub" passHref>
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Hub
                </Button>
            </Link>

            <div>
                <h1 className="text-3xl font-bold font-headline text-primary">Rankings</h1>
                <p className="text-muted-foreground mt-1">Selecione um ranking para visualizar.</p>
            </div>

            {accessibleServices.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {accessibleServices.map(service => (
                        <ServiceCard key={service.href} service={service} />
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground">Você não tem acesso a nenhum ranking no momento.</p>
            )}
        </div>
    )
}
