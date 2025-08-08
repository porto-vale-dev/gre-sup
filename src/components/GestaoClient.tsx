
"use client";

import { useState, useMemo } from 'react';
import { useTickets } from '@/contexts/TicketContext';
import type { TicketStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, Hourglass, AlertTriangle, CheckCircle2, User, Users, AlertCircle, BarChart2, Calendar as CalendarIcon, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays } from "date-fns";
import { ptBR } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

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
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    if (!date?.from) return tickets; // Return all if no start date

    const fromDate = date.from;
    const toDate = date.to ? new Date(date.to.setHours(23, 59, 59, 999)) : new Date(fromDate.setHours(23, 59, 59, 999));

    return tickets.filter(ticket => {
      const submissionDate = new Date(ticket.submission_date);
      return submissionDate >= fromDate && submissionDate <= toDate;
    });
  }, [tickets, date]);


  const stats = useMemo(() => {
    if (!filteredTickets || filteredTickets.length === 0) {
      return {
        total: 0,
        novo: 0,
        emAndamento: 0,
        atrasado: 0,
        concluido: 0,
        byResponsible: [],
        uniqueResponsibles: 0,
      };
    }
    
    const statusCounts = filteredTickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<TicketStatus, number>);

    const responsibleCounts = filteredTickets.reduce((acc, ticket) => {
        const responsible = ticket.responsible || 'Não atribuído';
        acc[responsible] = (acc[responsible] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const byResponsible = Object.entries(responsibleCounts)
      .map(([name, count]) => ({ name, total: count }))
      .sort((a, b) => b.total - a.total);
      
    const uniqueResponsibles = new Set(filteredTickets.map(t => t.responsible).filter(Boolean)).size;

    return {
      total: filteredTickets.length,
      novo: statusCounts["Novo"] || 0,
      emAndamento: statusCounts["Em Andamento"] || 0,
      atrasado: statusCounts["Atrasado"] || 0,
      concluido: statusCounts["Concluído"] || 0,
      byResponsible,
      uniqueResponsibles,
    };
  }, [filteredTickets]);

  if (isLoadingTickets) {
    return (
        <div className="space-y-6">
            <Card className="p-4"><Skeleton className="h-10 w-64" /></Card>
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
       <Card className="p-4 shadow-sm">
         <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y", { locale: ptBR })} -{" "}
                        {format(date.to, "LLL dd, y", { locale: ptBR })}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y", { locale: ptBR })
                    )
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setDate(undefined)}
                disabled={!date}
                className="text-muted-foreground hover:text-foreground"
            >
                <X className="mr-2 h-4 w-4" />
                Limpar
            </Button>
         </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tickets no Período" value={stats.total} Icon={FileText} description="Total de tickets no período." />
        <StatCard title="Em Andamento" value={stats.emAndamento} Icon={Hourglass} className="border-yellow-500/50" />
        <StatCard title="Atrasados" value={stats.atrasado} Icon={AlertTriangle} className="border-red-500/50 text-red-600" />
        <StatCard title="Concluídos" value={stats.concluido} Icon={CheckCircle2} className="border-green-500/50" />
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
                        allowDecimals={false}
                        />
                         <Tooltip
                            cursor={{ fill: "hsl(var(--accent))", radius: 4 }}
                            contentStyle={{ 
                                backgroundColor: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)"
                            }}
                        />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total de Tickets"/>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        <div className="col-span-12 lg:col-span-4 space-y-4">
            <StatCard title="Tickets Novos" value={stats.novo} Icon={FileText} className="border-blue-500/50" />
            <StatCard title="Responsáveis Ativos" value={stats.uniqueResponsibles} Icon={Users} description="Usuários com tickets no período." />
        </div>
      </div>
    </div>
  );
}
