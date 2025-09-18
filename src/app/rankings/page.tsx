
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Trophy, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Ranking {
  title: string;
  href: string;
  Icon: LucideIcon;
  description: string;
}

const rankings: Ranking[] = [
  {
    title: "Ranking Campanha",
    href: "/rankings/campanha",
    Icon: Trophy,
    description: "Confira os resultados da campanha atual.",
  },
];

const RankingCard = ({ ranking }: { ranking: Ranking }) => (
  <Link href={ranking.href} className="group block">
    <Card className="h-full hover:border-primary hover:shadow-lg transition-all duration-300 flex flex-col">
      <CardContent className="p-6 flex flex-col items-start gap-4 flex-grow">
        <div className="flex justify-between items-center w-full">
            <div className="bg-primary/10 text-primary p-3 rounded-lg">
                <ranking.Icon className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-card-foreground">{ranking.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{ranking.description}</p>
        </div>
      </CardContent>
    </Card>
  </Link>
);


export default function RankingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold font-headline text-primary">Rankings</h1>
            <p className="text-muted-foreground mt-1">Selecione um ranking para visualizar.</p>
        </div>
        <Link href="/hub" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Hub
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rankings.map(ranking => (
          <RankingCard key={ranking.href} ranking={ranking} />
        ))}
      </div>
    </div>
  );
}
