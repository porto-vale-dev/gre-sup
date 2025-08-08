
"use client";

import { useState, useMemo } from 'react';
import { useTickets } from '@/contexts/TicketContext';
import type { TicketStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, Hourglass, AlertTriangle, CheckCircle2, User, Users, AlertCircle, BarChart2, Calendar as CalendarIcon, X, FileDown, PieChart as PieChartIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
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

const PIE_CHART_COLORS = ["#64B5F6", "#4DB6AC", "#FFD54F", "#FF8A65", "#A1887F", "#90A4AE"];

export function GestaoClient() {
  const { tickets, isLoadingTickets, error } = useTickets();
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
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

  const handleExportCSV = () => {
    if (filteredTickets.length === 0) {
      alert("Não há dados para exportar no período selecionado.");
      return;
    }

    const headers = [
      "Protocolo",
      "Data de Abertura",
      "Solicitante",
      "Telefone",
      "Nome do Cliente",
      "CPF/CNPJ",
      "Grupo",
      "Cota",
      "Motivo",
      "Observações",
      "Status",
      "Responsável",
      "Previsão de Resposta",
    ];

    const csvRows = [headers.join(',')];

    const escapeCSV = (str: string | null | undefined) => {
        if (str === null || str === undefined) return '""';
        const value = String(str);
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return `"${value}"`;
    };

    filteredTickets.forEach(ticket => {
        const row = [
            escapeCSV(String(ticket.protocol).padStart(4, '0')),
            escapeCSV(format(new Date(ticket.submission_date), 'dd/MM/yyyy HH:mm:ss')),
            escapeCSV(ticket.name),
            escapeCSV(ticket.phone),
            escapeCSV(ticket.client_name),
            escapeCSV(ticket.cpf),
            escapeCSV(ticket.grupo),
            escapeCSV(ticket.cota),
            escapeCSV(ticket.reason),
            escapeCSV(ticket.observations),
            escapeCSV(ticket.status),
            escapeCSV(ticket.responsible),
            escapeCSV(ticket.estimated_response_time),
        ];
        csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel compatibility
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const fileName = `relatorio_tickets_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};


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
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
      
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

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
       <Card className="p-4 shadow-sm">
         <div className="flex flex-col sm:flex-row items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[300px] justify-start text-left font-normal",
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
                className="text-muted-foreground hover:text-foreground w-full sm:w-auto"
            >
                <X className="mr-2 h-4 w-4" />
                Limpar Filtro
            </Button>
            <div className="w-full sm:w-auto sm:ml-auto">
              <Button onClick={handleExportCSV} className="w-full">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
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
                    <PieChartIcon className="h-5 w-5" />
                    Tickets por Responsável
                </CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                 <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={stats.byResponsible}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="hsl(var(--primary))"
                        labelLine={false}
                        label={renderCustomizedLabel}
                      >
                        {stats.byResponsible.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                          contentStyle={{ 
                              backgroundColor: "hsl(var(--background))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "var(--radius)"
                          }}
                          formatter={(value) => [`${value} tickets`, undefined]}
                      />
                      <Legend iconSize={12} />
                    </PieChart>
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

    