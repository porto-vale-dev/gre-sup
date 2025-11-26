
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, UserPlus, Loader2, User, Users, Search, Filter, ShieldAlert, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'

interface Colaborador {
  id: string
  nome: string
  email: string
  time: string
  diretoria: string;
  lead_balance: number;
}

interface GroupedColaboradores {
  [key: string]: Colaborador[]
}

export default function AdminLeadBankPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [quantidade, setQuantidade] = useState('')
  const [descricao, setDescricao] = useState('')
  const [observacao, setObservacao] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [diretoriaFilter, setDiretoriaFilter] = useState('Todos');
  const [equipeFilter, setEquipeFilter] = useState('Todos');
  const { toast } = useToast()
  const { user, cargo, username: adminUsername, refreshLeadBalance } = useAuth(); // Get current admin user
  
  const canViewAdmin = cargo && ['adm'].includes(cargo);


  useEffect(() => {
    if (!canViewAdmin) {
      setIsLoading(false);
      return;
    }
    async function fetchColaboradores() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('colaboradores')
        .select('id, nome, email, diretoria, time')
        .order('diretoria')
        .order('time')
        .order('nome');

      if (error) {
        console.error('Erro ao buscar colaboradores:', error)
        toast({
          title: 'Erro ao buscar dados',
          description: 'Não foi possível carregar a lista de colaboradores. Verifique as permissões da tabela (RLS).',
          variant: 'destructive',
        })
        setColaboradores([])
      } else {
        // Fetch balance for each colaborador
        const colaboradoresComSaldo = await Promise.all(
          (data as any[]).map(async (colaborador) => {
            const { data: balance, error: balanceError } = await supabase.rpc('get_user_lead_balance', {
              p_user_email: colaborador.email,
            });

            if (balanceError) {
              console.error(`Erro ao buscar saldo para ${colaborador.email}:`, balanceError);
              return { ...colaborador, lead_balance: 0 };
            }
            return { ...colaborador, lead_balance: balance || 0 };
          })
        );
        setColaboradores(colaboradoresComSaldo)
      }
      setIsLoading(false)
    }
    fetchColaboradores()
  }, [toast, canViewAdmin])

  const diretorias = useMemo(() => {
    return ['Todos', ...Array.from(new Set(colaboradores.map(c => c.diretoria).filter(Boolean)))];
  }, [colaboradores]);

  const equipes = useMemo(() => {
    let filteredByDiretoria = colaboradores;
    if (diretoriaFilter !== 'Todos') {
        filteredByDiretoria = colaboradores.filter(c => c.diretoria === diretoriaFilter);
    }
    return ['Todos', ...Array.from(new Set(filteredByDiretoria.map(c => c.time).filter(Boolean)))];
  }, [colaboradores, diretoriaFilter]);


  const filteredAndGroupedColaboradores = useMemo(() => {
    const filtered = colaboradores.filter(c => {
        const searchMatch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.email.toLowerCase().includes(searchTerm.toLowerCase());
        const diretoriaMatch = diretoriaFilter === 'Todos' || c.diretoria === diretoriaFilter;
        const equipeMatch = equipeFilter === 'Todos' || c.time === equipeFilter;

        return searchMatch && diretoriaMatch && equipeMatch;
    });

    return filtered.reduce((acc, colaborador) => {
      const diretoria = (colaborador as any).diretoria || 'Sem Diretoria'
      if (!acc[diretoria]) {
        acc[diretoria] = []
      }
      acc[diretoria].push(colaborador)
      return acc
    }, {} as GroupedColaboradores)
  }, [colaboradores, searchTerm, diretoriaFilter, equipeFilter])


  const handleOpenDialog = (colaborador: Colaborador) => {
    setSelectedColaborador(colaborador)
    setQuantidade('')
    setDescricao('')
    setObservacao('')
    setIsDialogOpen(true)
  }
  
  const handleDiretoriaChange = (value: string) => {
      setDiretoriaFilter(value);
      setEquipeFilter('Todos'); // Reset equipe filter when diretoria changes
  }

  const handleAddLeads = async () => {
    if (!selectedColaborador || !quantidade || !user) {
        toast({ title: 'Campos obrigatórios', description: 'Por favor, preencha a quantidade de leads.', variant: 'destructive' })
        return
    }

    setIsSubmitting(true)

    const { error } = await supabase.from('lead_bank').insert({
      email: selectedColaborador.email,
      nome: selectedColaborador.nome,
      quantidade_lead: parseInt(quantidade, 10),
      descricao_padrao: descricao,
      observacao: observacao,
      user_id: user.id, // Correct: Use the admin's user ID
      usuario: adminUsername, // Correct: Use the admin's username
    })

    if (error) {
      console.error('Erro ao adicionar leads:', error)
      toast({
        title: 'Erro ao adicionar leads',
        description: `Não foi possível registrar os leads. Detalhes: ${error.message}`,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso!',
        description: `${quantidade} leads foram adicionados para ${selectedColaborador.nome}.`,
      })
      // Refetch balance for the updated user
      setColaboradores(prev => 
        prev.map(c => 
          c.id === selectedColaborador.id 
            ? { ...c, lead_balance: c.lead_balance + parseInt(quantidade, 10) }
            : c
        )
      );
      refreshLeadBalance(); // Refresh the current user's (admin's) balance as well
      setIsDialogOpen(false)
    }
    setIsSubmitting(false)
  }

  if (!canViewAdmin) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardHeader>
            <div className="mx-auto bg-destructive/10 text-destructive p-4 rounded-full w-fit">
                <ShieldAlert className="h-12 w-12" />
            </div>
            <CardTitle className="font-headline text-2xl text-destructive mt-4">
                Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
            <Button asChild>
              <Link href="/hub">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o Hub
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-grow">
          <Button asChild variant="outline">
            <Link href="/lead-bank">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a loja
            </Link>
          </Button>
           <h1 className="text-3xl font-bold mt-4">Administração de Leads</h1>
           <p className="text-muted-foreground">Adicione leads para os colaboradores.</p>
        </div>
      </div>

       <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-grow w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar colaborador por nome ou e-mail..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <Select value={diretoriaFilter} onValueChange={handleDiretoriaChange}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Diretoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {diretorias.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={equipeFilter} onValueChange={setEquipeFilter}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Equipe" />
                            </SelectTrigger>
                            <SelectContent>
                                {equipes.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                <Accordion type="single" collapsible className="w-full">
                {Object.entries(filteredAndGroupedColaboradores).map(([diretoria, colaboradores]) => (
                    <AccordionItem value={diretoria} key={diretoria}>
                    <AccordionTrigger>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <span className="font-semibold text-lg">{diretoria}</span>
                            <Badge variant="secondary">{colaboradores.length}</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Equipe</TableHead>
                            <TableHead>Saldo de Leads</TableHead>
                            <TableHead className="hidden sm:table-cell">E-mail</TableHead>
                            <TableHead className="text-right">Ação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {colaboradores.map(colaborador => (
                            <TableRow key={colaborador.id}>
                                <TableCell className="font-medium">{colaborador.nome}</TableCell>
                                <TableCell>{colaborador.time}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5">
                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-semibold">{colaborador.lead_balance}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">{colaborador.email}</TableCell>
                                <TableCell className="text-right">
                                <Button size="sm" onClick={() => handleOpenDialog(colaborador)}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Adicionar Leads
                                </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
                )}
            </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Leads para {selectedColaborador?.nome}</DialogTitle>
            <DialogDescription>
              Insira a quantidade de leads e detalhes da adição.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantidade" className="text-right">
                Quantidade
              </Label>
              <Input
                id="quantidade"
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="col-span-3"
                placeholder="Ex: 10"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="descricao" className="text-right">
                Descrição
              </Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="col-span-3"
                placeholder="Ex: Campanha de Junho"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="observacao" className="text-right">
                Observação
              </Label>
               <Textarea
                    id="observacao"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    className="col-span-3"
                    placeholder="Detalhes adicionais (opcional)"
                />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleAddLeads} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
