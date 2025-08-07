
"use client";

import { useMemo } from 'react';
import { useTickets } from '@/contexts/TicketContext';
import type { TicketStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, Hourglass, AlertTriangle, CheckCircle2, User, Users, AlertCircle, BarChart2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

interface StatCardProps {
  title: string;
  value: number | string;
  Icon: LucideIcon;
  description?: string;
  className?: string;
}

const StatCard = ({ title, value, Icon, description, className }: StatCardProps) => (
  <Card className={className}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-4xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

export function GestaoClient() {
  const { tickets, isLoadingTickets, error } = useTickets();

  const stats = useMemo(() => {
    if (!tickets || tickets.length === 0) {
      return {
        total: 0,
        novo: 0,
        emAndamento: 0,
        atrasado: 0,
        concluido: 0,
        byResponsible: [],
      };
    }
    
    const statusCounts = tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<TicketStatus, number>);

    const responsibleCounts = tickets.reduce((acc, ticket) => {
        const responsible = ticket.responsible || 'Não atribuído';
        acc[responsible] = (acc[responsible] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const byResponsible = Object.entries(responsibleCounts)
      .map(([name, count]) => ({ name, total: count }))
      .sort((a, b) => b.total - a.total);

    return {
      total: tickets.length,
      novo: statusCounts["Novo"] || 0,
      emAndamento: statusCounts["Em Andamento"] || 0,
      atrasado: statusCounts["Atrasado"] || 0,
      concluido: statusCounts["Concluído"] || 0,
      byResponsible,
    };
  }, [tickets]);

  if (isLoadingTickets) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-[126px]" />
                <Skeleton className="h-[126px]" />
                <Skeleton className="h-[126px]" />
                <Skeleton className="h-[126px]" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-12 lg:col-span-4">
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent className="pl-2">
                        <Skeleton className="h-[350px] w-full" />
                    </CardContent>
                </Card>
                 <div className="col-span-12 lg:col-span-3 space-y-4">
                    <Skeleton className="h-[126px]" />
                    <Skeleton className="h-[126px]" />
                    <Skeleton className="h-[126px]" />
                 </div>
            </div>
        </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>Erro ao Carregar os Dados</AlertTitle>
        <AlertDescription>
          Não foi possível buscar os dados dos tickets. Tente novamente mais tarde.
          <p className="mt-2 text-xs"><strong>Detalhes:</strong> {error}</p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tickets Totais" value={stats.total} Icon={FileText} description="Total de tickets registrados." />
        <StatCard title="Tickets Novos" value={stats.novo} Icon={FileText} className="border-blue-500/50" />
        <StatCard title="Em Andamento" value={stats.emAndamento} Icon={Hourglass} className="border-yellow-500/50" />
        <StatCard title="Atrasados" value={stats.atrasado} Icon={AlertTriangle} className="border-red-500/50 text-red-600" />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5" />
                    Tickets por Responsável
                </CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                 <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={stats.byResponsible}>
                        <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        />
                        <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                        />
                         <Tooltip
                            cursor={{ fill: "hsl(var(--accent))", radius: 4 }}
                            contentStyle={{ 
                                backgroundColor: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)"
                            }}
                        />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        <div className="col-span-12 lg:col-span-4 space-y-4">
            <StatCard title="Concluídos" value={stats.concluido} Icon={CheckCircle2} className="border-green-500/50" />
            <StatCard title="Responsáveis Ativos" value={stats.byResponsible.length} Icon={Users} description="Total de usuários com tickets." />
        </div>
      </div>
    </div>
  );
}
