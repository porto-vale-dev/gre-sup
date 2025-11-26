
"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, ArrowRight, Ticket, Megaphone, FolderKanban, LayoutDashboard, FileSearch, Handshake, FileCheck, ShoppingBasket, BadgeDollarSign } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  title: string;
  href: string;
  Icon: LucideIcon;
  description: string;
  allowedRoles: string[];
  color: string;
}

const allServices: Service[] = [
    { title: "Rankings", href: "/rankings", Icon: Trophy, description: "Acesse os rankings de desempenho.", allowedRoles: ["adm", "diretor", "gerente", "gerente1", "greadmin", "greadminsa", "gre", "grea", "colaborador", "diretorseg", "gre_apoio", "gre_apoio_admin", "gre_con", "gre_con_admin"], color: 'purple' },
    { title: "Mural de Avisos - GRE", href: "/mural-de-aviso", Icon: Megaphone, description: "Veja os últimos avisos e comunicados.", allowedRoles: ["adm", "diretor", "gerente", "gerente1", "colaborador", "greadmin", "greadminsa", "gre", "grea", "diretorseg", "gre_apoio", "gre_apoio_admin", "gre_con", "gre_con_admin"], color: 'amber' },
    { title: "Documentos", href: "/documentos", Icon: FolderKanban, description: "Acesse os documentos da empresa.", allowedRoles: ["adm"], color: 'orange' },
    { title: "Painel de Suporte - GRE", href: "/suporte-gre/painel", Icon: FolderKanban, description: "Gerencie os tickets de suporte.", allowedRoles: ["adm", "greadmin", "greadminsa", "gre", "grea", "gre_apoio_admin"], color: 'blue-dark' },
    { title: "Painel de Apoio Jacareí", href: "/suporte-gre/cobranca/dashboard", Icon: Handshake, description: "Gerencie os tickets de apoio.", allowedRoles: ['adm', 'greadmin', 'greadminsa', 'gre_apoio', 'gre_apoio_admin'], color: 'red' },
    { title: "Painel de Pós-Contemplação", href: "/pos-contemplacao/dashboard", Icon: FileCheck, description: "Gerencie os tickets de pós-contemplação.", allowedRoles: ['adm', 'greadmin', 'gre_con', 'gre_con_admin'], color: 'teal-dark' },
    { title: "Novo ticket - GRE", href: "/suporte-gre", Icon: Ticket, description: "Abra um novo chamado para o suporte.", allowedRoles: ["adm", "diretor", "gerente", "greadmin", "greadminsa", "gre", "grea", "diretorseg", "gre_apoio", "gre_apoio_admin", "gre_con", "gre_con_admin", "colaborador"], color: 'blue' },
    { title: "Acompanhar Solicitação", href: "/suporte-gre/minhas-solicitacoes", Icon: FileSearch, description: "Acompanhe o andamento dos seus tickets.", allowedRoles: ["adm", "diretor", "gerente", "greadmin", "greadminsa", "gre", "grea", "diretorseg", "gre_apoio", "gre_apoio_admin", "gre_con", "gre_con_admin"], color: 'green' },
    { title: "Lead Bank", href: "/lead-bank", Icon: ShoppingBasket, description: "Compre produtos institucionais.", allowedRoles: ["adm", "diretor", "gerente", "gerente1", "colaborador", "greadmin", "greadminsa", "gre", "grea", "diretorseg", "gre_apoio", "gre_apoio_admin", "gre_con", "gre_con_admin"], color: 'pink' },
];

const colorVariants = {
  purple: 'border-[#8b5cf6] bg-[#8b5cf6] text-white',
  amber: 'border-[#eab308] bg-[#eab308] text-white',
  blue: 'border-[#3b82f6] bg-[#3b82f6] text-white',
  green: 'border-[#22c55e] bg-[#22c55e] text-white',
  'blue-dark': 'border-[#3e5a88] bg-[#3e5a88] text-white',
  red: 'border-[#ef4444] bg-[#ef4444] text-white',
  'teal-dark': 'border-[#0f766e] bg-[#0f766e] text-white',
  orange: 'border-[#ea580c] bg-[#ea580c] text-white',
  pink: 'border-[#ec4899] bg-[#ec4899] text-white',
};


const ServiceCard = ({ service }: { service: Service }) => {
  const colorClass = colorVariants[service.color as keyof typeof colorVariants] || 'border-gray-500 bg-gray-500 text-white';

  return (
    <Link href={service.href} className="group block h-full">
       <Card className={cn(
        "relative h-full overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1 flex flex-col",
        "border-0 border-l-4",
        colorClass.split(' ')[0] // Usa a classe da borda para a esquerda
      )}>
        <CardContent className="p-6 flex items-center gap-6 flex-grow">
           <div className={cn("p-3 rounded-lg", colorClass.split(' ')[1])}>
             <service.Icon className={cn("h-8 w-8", colorClass.split(' ')[2])} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-card-foreground">{service.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </CardContent>
      </Card>
    </Link>
  );
};

export default function HubPage() {
    const { cargo, email, username } = useAuth();
    
    const accessibleServices = useMemo(() => {
      // Trata usuários com cargo nulo, vazio ou indefinido como "colaborador"
      const userRole = cargo || 'colaborador';
      
      let filtered = allServices.filter(service => service.allowedRoles.includes(userRole));
      
      // Regra específica para o usuário 'aprendiz.gre@portovaleconsorcios.com.br'
      if (email === 'aprendiz.gre@portovaleconsorcios.com.br') {
        filtered = filtered.filter(service => service.title !== 'Painel de Apoio Jacareí');
      }

      // Regra específica para o usuário 'diretor01'
      if (username === 'diretor01') {
        filtered = filtered.filter(service => 
            service.title !== 'Acompanhar Solicitação' && 
            service.title !== 'Novo ticket - GRE' &&
            service.title !== 'Mural de Avisos - GRE'
        );
      }

      return filtered;
    }, [cargo, email, username]);

    const generalTools = useMemo(() => {
      return accessibleServices.filter(s => s.title === "Rankings" || s.title === "Mural de Avisos - GRE" || s.title === "Novo ticket - GRE" || s.title === "Acompanhar Solicitação" || s.title === "Lead Bank");
    }, [accessibleServices]);

    const adminTools = useMemo(() => {
      return accessibleServices.filter(s => s.title === "Painel de Suporte - GRE" || s.title === "Documentos" || s.title === "Painel de Apoio Jacareí" || s.title === "Painel de Pós-Contemplação");
    }, [accessibleServices]);
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline text-[#334155]">Ferramentas</h1>
                <p className="text-muted-foreground mt-1">Selecione uma ferramenta para continuar.</p>
            </div>
            
            {accessibleServices.length > 0 ? (
                 <div className="space-y-10">
                    {generalTools.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-semibold tracking-tight border-b pb-2 mb-6">Geral</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                                {generalTools.map(service => (
                                    <ServiceCard key={service.href} service={service} />
                                ))}
                            </div>
                        </section>
                    )}

                    {adminTools.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-semibold tracking-tight border-b pb-2 mb-6">Administrativo</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
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
