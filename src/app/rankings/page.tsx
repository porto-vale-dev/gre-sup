
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Trophy, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Ranking {
  title: string;
  href: string;
  Icon: LucideIcon;
  description: string;
  allowedRoles: string[];
  color: string;
}

const allRankings: Ranking[] = [
  {
    title: "Ranking Diretor",
    href: "/rankings/diretor",
    Icon: Trophy,
    description: "Visualize o ranking de diretores.",
    allowedRoles: ['adm', 'greadmin', 'greadminsa', 'diretor'],
    color: 'purple'
  },
  {
    title: "Ranking Gerente",
    href: "/rankings/gerente",
    Icon: Trophy,
    description: "Acompanhe o desempenho dos gerentes.",
    allowedRoles: ['adm', 'greadmin', 'greadminsa', 'diretor', 'gerente', 'gerente1'],
    color: 'amber'
  },
  {
    title: "Ranking Campanha",
    href: "/rankings/campanha",
    Icon: Trophy,
    description: "Confira os resultados da campanha atual.",
    allowedRoles: ['adm', 'greadmin', 'greadminsa', 'diretor', 'gerente', 'gerente1', 'gre', 'grea', 'gre_con', 'gre_con_admin', 'gre_apoio_admin', 'gre_apoio', 'colaborador'],
    color: 'blue'
  },
   {
    title: "Ranking Campanha Seguros",
    href: "/rankings/campanha-seguros",
    Icon: Trophy,
    description: "Resultados da campanha de seguros.",
    allowedRoles: ['adm', 'greadmin', 'greadminsa', 'diretorseg'],
    color: 'orange'
  },
  {
    title: "Ranking Trimestral",
    href: "/rankings/trimestral",
    Icon: Trophy,
    description: "Veja o balanço do trimestre.",
    allowedRoles: ['adm', 'greadmin', 'greadminsa', 'diretor'],
    color: 'green'
  },
  {
    title: "Ranking Indicação de Seguros",
    href: "/rankings/administrativo",
    Icon: Trophy,
    description: "Visualize o ranking de indicação de seguros.",
    allowedRoles: ['adm', 'greadmin'],
    color: 'red'
  },
];

const colorVariants = {
  blue: 'border-[#3b82f6] bg-[#3b82f6] text-white',
  green: 'border-[#22c55e] bg-[#22c55e] text-white',
  purple: 'border-[#8b5cf6] bg-[#8b5cf6] text-white',
  orange: 'border-[#ea580c] bg-[#ea580c] text-white',
  amber: 'border-[#eab308] bg-[#eab308] text-white',
  red: 'border-[#ef4444] bg-[#ef4444] text-white',
};


const RankingCard = ({ ranking }: { ranking: Ranking }) => {
  const colorClass = colorVariants[ranking.color as keyof typeof colorVariants] || colorVariants.blue;

  return (
    <Link href={ranking.href} className="group block">
       <Card className={cn(
        "relative h-full overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1 flex flex-col",
        "border-0 border-l-4",
        colorClass.split(' ')[0] // Usa a classe da borda para a esquerda
      )}>
        <CardContent className="p-6 flex items-center gap-6 flex-grow">
           <div className={cn("p-3 rounded-lg", colorClass.split(' ')[1])}>
             <ranking.Icon className={cn("h-8 w-8", colorClass.split(' ')[2])} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-card-foreground">{ranking.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{ranking.description}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </CardContent>
      </Card>
    </Link>
  );
};


export default function RankingsPage() {
  const { cargo, email } = useAuth();
  
  const accessibleRankings = useMemo(() => {
    // Regra específica para o usuário 'naira.nunes@portovaleconsorcios.com.br'
    if (email === 'naira.nunes@portovaleconsorcios.com.br') {
        return allRankings.filter(ranking => 
            ranking.title === "Ranking Gerente" || ranking.title === "Ranking Campanha"
        );
    }
    
    // Regra específica para o usuário 'aprendiz.gre@portovaleconsorcios.com.br'
    if (email === 'aprendiz.gre@portovaleconsorcios.com.br') {
        return allRankings.filter(ranking => ranking.title === "Ranking Campanha");
    }
    
    // Regra geral para os outros usuários
    const userRole = cargo || 'colaborador';
    return allRankings.filter(ranking => ranking.allowedRoles.includes(userRole));
  }, [cargo, email]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold font-headline text-[#334155]">Rankings</h1>
            <p className="text-muted-foreground mt-1">Selecione um ranking para visualizar.</p>
        </div>
        <Link href="/hub" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Hub
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
        {accessibleRankings.map(ranking => (
          <RankingCard key={ranking.href} ranking={ranking} />
        ))}
      </div>
    </div>
  );
}
