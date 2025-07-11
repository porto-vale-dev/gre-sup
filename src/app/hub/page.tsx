
"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, ArrowRight, Ticket, Megaphone, FolderKanban } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Service {
  title: string;
  href: string;
  Icon: LucideIcon;
  description: string;
  allowedRoles: string[];
}

const allServices: Service[] = [
    { title: "Rankings", href: "/rankings", Icon: Trophy, description: "Acesse os rankings de desempenho.", allowedRoles: ["adm", "diretor", "gerente", "colaborador"] },
    { title: "Mural de Avisos - GRE", href: "/mural-de-avisos", Icon: Megaphone, description: "Veja os últimos avisos e comunicados.", allowedRoles: ["adm", "diretor", "gerente", "colaborador"] },
    { title: "Documentos", href: "/documentos", Icon: FolderKanban, description: "Acesse os documentos da empresa.", allowedRoles: ["adm", "diretor", "gerente"] },
    { title: "Painel de Suporte - GRE", href: "/suporte-gre/painel", Icon: Ticket, description: "Gerencie os tickets de suporte.", allowedRoles: ["adm"] },
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

export default function HubPage() {
    const { cargo } = useAuth();
    
    const accessibleServices = useMemo(() => {
      // Trata usuários com cargo nulo, vazio ou indefinido como "colaborador"
      const userRole = cargo || 'colaborador';
      return allServices.filter(service => service.allowedRoles.includes(userRole));
    }, [cargo]);

    const generalTools = useMemo(() => {
      return accessibleServices.filter(s => s.title === "Rankings" || s.title === "Mural de Avisos - GRE");
    }, [accessibleServices]);

    const adminTools = useMemo(() => {
      return accessibleServices.filter(s => s.title === "Painel de Suporte - GRE" || s.title === "Documentos");
    }, [accessibleServices]);
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline text-primary">Ferramentas</h1>
                <p className="text-muted-foreground mt-1">Selecione uma ferramenta para continuar.</p>
            </div>
            
            {accessibleServices.length > 0 ? (
                 <div className="space-y-10">
                    {generalTools.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-semibold tracking-tight border-b pb-2 mb-6">Geral</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {generalTools.map(service => (
                                    <ServiceCard key={service.href} service={service} />
                                ))}
                            </div>
                        </section>
                    )}

                    {adminTools.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-semibold tracking-tight border-b pb-2 mb-6">Administrativo</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {adminTools.map(service => (
                                    <ServiceCard key={service.href} service={service} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            ) : (
                <p className="text-muted-foreground">Você não tem acesso a nenhuma ferramenta no momento.</p>
            )}
        </div>
    )
}
