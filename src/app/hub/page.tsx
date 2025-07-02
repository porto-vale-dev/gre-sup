
"use client";

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, ArrowRight, Ticket, Megaphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Service {
  title: string;
  href: string;
  Icon: LucideIcon;
  description: string;
  allowedRoles: string[];
}

const allServices: Service[] = [
    { title: "Rankings", href: "/rankings", Icon: Trophy, description: "Acesse os rankings de desempenho.", allowedRoles: ["adm", "diretor", "gerente", "colaborador"] },
    { title: "Sistema Suporte GRE", href: "/suporte-gre/painel", Icon: Ticket, description: "Gerencie os tickets de suporte.", allowedRoles: ["adm"] },
    { title: "Mural de Avisos", href: "/mural-de-avisos", Icon: Megaphone, description: "Veja os últimos avisos e comunicados.", allowedRoles: ["adm", "diretor", "gerente", "colaborador"] },
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


const HubSkeleton = () => (
    <div className="space-y-8">
        <div>
            <Skeleton className="h-9 w-40 mb-2" />
            <Skeleton className="h-6 w-80" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="h-full">
                    <CardContent className="p-6 flex flex-col items-start gap-4">
                        <div className="flex justify-between items-center w-full">
                           <Skeleton className="h-12 w-12 rounded-lg" />
                           <Skeleton className="h-5 w-5 rounded-full" />
                        </div>
                        <div>
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
);


export default function HubPage() {
    const { isAuthenticated, isLoading, cargo } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/');
        }
    }, [isLoading, isAuthenticated, router]);
    
    const accessibleServices = useMemo(() => {
      // Trata usuários com cargo nulo, vazio ou indefinido como "colaborador"
      const userRole = cargo || 'colaborador';
      return allServices.filter(service => service.allowedRoles.includes(userRole));
    }, [cargo]);


    if (isLoading || !isAuthenticated) {
        return <HubSkeleton />;
    }
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline text-primary">Ferramentas</h1>
                <p className="text-muted-foreground mt-1">Selecione uma ferramenta para continuar.</p>
            </div>
            
            {accessibleServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accessibleServices.map(service => (
                        <ServiceCard key={service.href} service={service} />
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground">Você não tem acesso a nenhuma ferramenta no momento.</p>
            )}
        </div>
    )
}
