
"use client";

import { useState, useMemo, useEffect } from 'react';
import { usePosContemplacaoTickets } from '@/contexts/PosContemplacaoTicketContext';
import type { PosContemplacaoTicketStatus, PosContemplacaoTicket } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, Hourglass, CheckCircle2, User, AlertCircle, BarChart2, Calendar as CalendarIcon, X, FileDown, PieChart as PieChartIcon, Loader2, History, ChevronDown, Download, Filter, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, parseISO } from "date-fns";
import { ptBR } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RESPONSAVEIS } from '@/lib/posContemplacaoData';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';


interface StatCardProps {
  title: string;
  value: number | string;
  Icon: LucideIcon;
  description?: string;
  className?: string;
}

interface ExportHistoryItem {
    fileName: string;
    timestamp: number;
    fileContent: string; // Base64 encoded file content
    username: string | null;
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

const PIE_CHART_COLORS = ["#64B5F6", "#4DB6AC", "#FFD54F", "#FF8A65", "#A1887F", "#90A4AE", "#7986CB", "#E57373"];

const NAME_COLOR_MAP: { [key: string]: string } = {
    'Bruna': '#64B5F6',    // Blue
    'Dominik': '#FFD54F', // Yellow
    'Sara': '#4DB6AC',     // Teal
    'Pedro': '#FF8A65',    // Orange
};

const findNameByEmail = (email: string) => {
    const user = RESPONSAVEIS.find(r => r.email.toLowerCase() === email.toLowerCase());
    return user ? user.name : email.split('@')[0];
};


export function PosContemplacaoGestaoClient() {
  const { tickets, isLoading: isLoadingTickets, error } = usePosContemplacaoTickets();
  const { toast } = useToast();
  const { username } = useAuth();

  const [isExporting, setIsExporting] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [responsibleFilter, setResponsibleFilter] = useState<string>("Todos");
  const [relatorFilter, setRelatorFilter] = useState<string>("Todos");
  const [chartView, setChartView] = useState<'responsible' | 'relator'>('responsible');
  const [exportHistory, setExportHistory] = useLocalStorage<ExportHistoryItem[]>("posContemplacaoExportHistory", []);
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];

    let dateFilteredTickets = tickets;
    if (date?.from) {
        const fromDate = date.from;
        const toDate = date.to ? new Date(date.to.setHours(23, 59, 59, 999)) : new Date(fromDate.setHours(23, 59, 59, 999));
        dateFilteredTickets = tickets.filter(ticket => {
            const ticketDate = ticket.created_at;
            if (!ticketDate) return false;
            const submissionDate = new Date(ticketDate);
            return submissionDate >= fromDate && submissionDate <= toDate;
        });
    }

    let responsibleFiltered = dateFilteredTickets;
    if (responsibleFilter !== "Todos") {
        responsibleFiltered = dateFilteredTickets.filter(ticket => ticket.responsavel === responsibleFilter);
    }
    
    if (relatorFilter !== "Todos") {
      return responsibleFiltered.filter(ticket => ticket.relator === relatorFilter);
    }

    return responsibleFiltered;
  }, [tickets, date, responsibleFilter, relatorFilter]);

  const handleExportXLSX = () => {
    if (filteredTickets.length === 0) {
      toast({
        variant: 'destructive',
        title: "Nenhum Dado",
        description: "Não há dados para exportar no período selecionado.",
      });
      return;
    }

    setIsExporting(true);
    
    try {
        const dataToExport = filteredTickets.map(ticket => ({
            "Protocolo": String(ticket.protocolo).padStart(4, '0'),
            "Data de Abertura": format(parseISO(ticket.created_at), 'dd/MM/yyyy HH:mm:ss'),
            "Cliente": ticket.nome_cliente,
            "CPF/CNPJ": ticket.cpf,
            "Grupo": ticket.grupo,
            "Cota": ticket.cota,
            "Telefone": ticket.telefone,
            "Email": ticket.email,
            "Relator": findNameByEmail(ticket.relator),
            "Responsável": findNameByEmail(ticket.responsavel),
            "Motivo": ticket.motivo,
            "Observações": ticket.observacoes,
            "Status": ticket.status,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

        const colWidths = Object.keys(dataToExport[0]).map(key => ({
            wch: Math.max(...dataToExport.map(row => row[key as keyof typeof row]?.toString().length || 0), key.length) + 2
        }));
        worksheet['!cols'] = colWidths;
        
        const fileBase64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
        const fileName = `relatorio_pos_contemplacao_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`;
        
        const newHistoryItem: ExportHistoryItem = {
            fileName,
            timestamp: Date.now(),
            fileContent: fileBase64,
            username: username
        };

        setExportHistory(prevHistory => [newHistoryItem, ...prevHistory].slice(0, 10));
        
        const blob = new Blob(
            [Buffer.from(fileBase64, 'base64')],
            { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        

        toast({
            title: "Exportação Concluída",
            description: `O arquivo ${fileName} foi baixado.`,
        });

    } catch (e) {
        toast({
            variant: 'destructive',
            title: "Erro na Exportação",
            description: "Não foi possível gerar a planilha.",
        });
        console.error("Failed to export XLSX:", e);
    } finally {
        setIsExporting(false);
    }
  };
  
  const downloadFromHistory = (item: ExportHistoryItem) => {
    try {
        const blob = new Blob(
            [Buffer.from(item.fileContent, 'base64')],
            { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: "Erro no Download",
            description: "Não foi possível baixar o arquivo do histórico.",
        });
    }
  };

  const userExportHistory = useMemo(() => {
    if (!username) return [];
    return exportHistory.filter(item => item.username === username).slice(0, 5);
  }, [exportHistory, username]);

  const relatorsForFilter = useMemo(() => {
    const uniqueRelatorEmails = [...new Set(tickets.map(t => t.relator))];
    const relatorObjects = uniqueRelatorEmails.map(email => ({ 
        email: email, 
        name: findNameByEmail(email)
    }));
    return [{ email: 'Todos', name: 'Todos os Relatores' }, ...relatorObjects];
  }, [tickets]);


  const stats = useMemo(() => {
    if (!filteredTickets || filteredTickets.length === 0) {
      return {
        total: 0,
        aberto: 0,
        emAnalise: 0,
        concluido: 0,
        byResponsible: [],
        byRelator: [],
        byMotivo: [],
      };
    }
    
    const statusCounts = filteredTickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<PosContemplacaoTicketStatus, number>);

    const responsibleCounts = filteredTickets.reduce((acc, ticket) => {
        const responsible = findNameByEmail(ticket.responsavel || 'Não atribuído');
        acc[responsible] = (acc[responsible] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const relatorCounts = filteredTickets.reduce((acc, ticket) => {
        const relator = findNameByEmail(ticket.relator || 'Não atribuído');
        acc[relator] = (acc[relator] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const motivoCounts = filteredTickets.reduce((acc, ticket) => {
        const motivo = ticket.motivo || 'Não especificado';
        acc[motivo] = (acc[motivo] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const byResponsible = Object.entries(responsibleCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
      
    const byRelator = Object.entries(relatorCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const byMotivo = Object.entries(motivoCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      total: filteredTickets.length,
      aberto: statusCounts["Aberto"] || 0,
      emAnalise: statusCounts["Em Análise"] || 0,
      concluido: statusCounts["Concluído"] || 0,
      byResponsible,
      byRelator,
      byMotivo,
    };
  }, [filteredTickets]);

  if (isLoadingTickets) {
    return (
        <div className="space-y-6">
            <Card className="p-4"><Skeleton className="h-10 w-full" /></Card>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

    if (percent * 100 < 3) return null;

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
            
            <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por responsável" />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="Todos">Todos Responsáveis</SelectItem>
                  {RESPONSAVEIS.map(responsavel => (
                    <SelectItem key={responsavel.email} value={responsavel.email} className="capitalize">{responsavel.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={relatorFilter} onValueChange={setRelatorFilter}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por relator" />
              </SelectTrigger>
              <SelectContent>
                 {relatorsForFilter.map(relator => (
                    <SelectItem key={relator.email} value={relator.email} className="capitalize">{relator.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                    setDate(undefined);
                    setResponsibleFilter("Todos");
                    setRelatorFilter("Todos");
                }}
                disabled={!date && responsibleFilter === "Todos" && relatorFilter === "Todos"}
                className="text-muted-foreground hover:text-foreground w-full sm:w-auto"
            >
                <X className="mr-2 h-4 w-4" />
                Limpar Filtros
            </Button>
            <div className="w-full sm:w-auto sm:ml-auto">
              <Button onClick={handleExportXLSX} className="w-full" disabled={isExporting}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                {isExporting ? 'Exportando...' : 'Exportar Planilha'}
              </Button>
            </div>
         </div>
      </Card>
      
      {userExportHistory.length > 0 && (
         <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between p-4 cursor-pointer" onClick={() => setIsHistoryVisible(!isHistoryVisible)}>
                <div className="flex items-center gap-3">
                    <History className="h-5 w-5 text-primary"/>
                    <CardTitle className="text-lg">Histórico de Exportações</CardTitle>
                </div>
                <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", isHistoryVisible && "rotate-180")} />
            </CardHeader>
            {isHistoryVisible && (
                <CardContent className="p-4 pt-0">
                    <div className="space-y-2">
                        {userExportHistory.map((item) => (
                            <div key={item.timestamp} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                                <div className="flex flex-col">
                                    <span className="font-medium">{item.fileName}</span>
                                    <span className="text-xs text-muted-foreground">{format(item.timestamp, "dd/MM/yyyy 'às' HH:mm")}</span>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => downloadFromHistory(item)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Baixar
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            )}
        </Card>
      )}

        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Tickets no Período" value={stats.total} Icon={FileText} description="Total de tickets de pós-contemplação." />
                <StatCard title="Em Análise" value={stats.emAnalise} Icon={Hourglass} className="border-yellow-500/50" />
                <StatCard title="Concluídos" value={stats.concluido} Icon={CheckCircle2} className="border-green-500/50" />
            </div>

            <div className="grid grid-cols-12 gap-4">
                <Card className="col-span-12 lg:col-span-7">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5" />
                                {chartView === 'responsible' ? 'Tickets por Responsável' : 'Tickets por Relator'}
                            </CardTitle>
                             <ToggleGroup
                                type="single"
                                size="sm"
                                value={chartView}
                                onValueChange={(value: 'responsible' | 'relator') => {
                                    if (value) setChartView(value);
                                }}
                            >
                                <ToggleGroupItem value="responsible" aria-label="Ver por responsável">
                                    <Users className="h-4 w-4 mr-2"/>
                                    Responsável
                                </ToggleGroupItem>
                                <ToggleGroupItem value="relator" aria-label="Ver por relator">
                                    <User className="h-4 w-4 mr-2"/>
                                    Relator
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                            <Pie
                                data={chartView === 'responsible' ? stats.byResponsible : stats.byRelator}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={120}
                                fill="hsl(var(--primary))"
                                labelLine={false}
                                label={stats.byResponsible.length > 0 ? renderCustomizedLabel : undefined}
                            >
                                {(chartView === 'responsible' ? stats.byResponsible : stats.byRelator).map((entry, index) => {
                                    const color = NAME_COLOR_MAP[entry.name] || PIE_CHART_COLORS[index % PIE_CHART_COLORS.length];
                                    return <Cell key={`cell-${index}`} fill={color} />;
                                })}
                            </Pie>
                            <Tooltip
                                contentStyle={{ 
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)"
                                }}
                                formatter={(value, name) => [`${value} tickets`, name]}
                            />
                            <Legend iconSize={12} wrapperStyle={{fontSize: "0.8rem"}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="col-span-12 lg:col-span-5">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart2 className="h-5 w-5" />
                            Top Motivos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.byMotivo.slice(0, 5).map((motivo, index) => (
                                <div key={index} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-muted-foreground">{motivo.name}</span>
                                        <span>{motivo.value}</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary" 
                                            style={{width: `${(motivo.value / stats.total) * 100}%`}}
                                        />
                                    </div>
                                </div>
                            ))}
                            {stats.byMotivo.length === 0 && <p className="text-sm text-muted-foreground text-center">Nenhum dado para exibir.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    </div>
  );
}
