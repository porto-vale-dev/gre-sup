
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Wallet, FileText, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Compra {
  created_at: string;
  produto: string;
  total: number;
  folha: boolean; // Adicionado para verificar a forma de pagamento
}

interface LeadBankEntry {
  created_at: string;
  quantidade_lead: number;
  descricao_padrao: string | null;
  observacao: string | null;
  usuario?: string; // Adicionado para mostrar quem deu o crédito
}

type Transacao = 
  | ({ type: 'compra' } & Compra)
  | ({ type: 'credito' } & LeadBankEntry);

export default function ExtratoPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, leadBalance, refreshLeadBalance } = useAuth();

  useEffect(() => {
    refreshLeadBalance();
  }, [refreshLeadBalance]);

  useEffect(() => {
    async function fetchTransacoes() {
      if (!user?.email) {
        setIsLoading(false);
        setError("Usuário não autenticado ou sem e-mail.");
        return;
      }

      try {
        setIsLoading(true);
        const [comprasRes, creditosRes] = await Promise.all([
          supabase
            .from('compras')
            .select('created_at, produto, total, folha') // Seleciona a coluna 'folha'
            .eq('email', user.email)
            .order('created_at', { ascending: false }),
          supabase
            .from('lead_bank')
            .select('created_at, quantidade_lead, descricao_padrao, observacao, usuario')
            .eq('email', user.email)
            .gt('quantidade_lead', 0) // Filtra apenas créditos (quantidade > 0)
            .order('created_at', { ascending: false }),
        ]);

        if (comprasRes.error) throw comprasRes.error;
        if (creditosRes.error) throw creditosRes.error;
        
        const comprasData: Transacao[] = (comprasRes.data || []).map(c => ({...c, type: 'compra'}));
        const creditosData: Transacao[] = (creditosRes.data || []).map(c => ({...c, type: 'credito'}));
        
        const allTransacoes = [...comprasData, ...creditosData].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setTransacoes(allTransacoes);

      } catch (err: any) {
        setError("Não foi possível carregar o extrato. Tente novamente mais tarde.");
        console.error("Error fetching statement:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransacoes();
  }, [user]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-12 text-destructive">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p>{error}</p>
        </div>
      );
    }
    
    if (transacoes.length === 0) {
       return (
        <div className="flex flex-col items-center justify-center text-center p-12 text-muted-foreground">
          <FileText className="h-8 w-8 mb-2" />
          <p>Nenhuma transação encontrada no seu extrato.</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transacoes.map((entry, index) => {
            const isCompra = entry.type === 'compra';
            
            let descricao: string;
            if (isCompra) {
                descricao = `Compra de item: ${entry.produto}`;
            } else {
                let creditDesc = entry.descricao_padrao || entry.observacao || 'Movimentação de leads';
                if (entry.usuario && entry.quantidade_lead > 0) {
                    creditDesc = `Crédito adicionado por: ${entry.usuario} - ${creditDesc}`;
                }
                descricao = creditDesc;
            }
            
            let valor: string | number;
            let unidade: string;
            let corValor: string;

            if (isCompra) {
                if(entry.folha) { // Se 'folha' for true, é em dinheiro
                    valor = `- R$ ${entry.total.toFixed(2).replace('.', ',')}`;
                    unidade = '';
                    corValor = 'text-red-500';
                } else { // Se 'folha' for false, é em leads
                    valor = -Math.ceil(entry.total / 15);
                    unidade = ' Leads';
                    corValor = 'text-red-500';
                }
            } else {
                valor = entry.quantidade_lead;
                unidade = ' Leads';
                corValor = entry.quantidade_lead > 0 ? 'text-green-500' : 'text-red-500';
            }

            return (
                <TableRow key={index}>
                  <TableCell className="font-medium text-muted-foreground">
                      {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </TableCell>
                  <TableCell>{descricao}</TableCell>
                  <TableCell className={`text-right font-semibold ${corValor}`}>
                      {typeof valor === 'number' && valor > 0 ? '+' : ''}
                      {valor}{unidade}
                  </TableCell>
                </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 space-y-8">
      <div>
        <Button asChild variant="outline">
          <Link href="/lead-bank">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a loja
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                 <FileText className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-3xl font-bold">Extrato Lead Bank</CardTitle>
                    <CardDescription>Confira suas últimas movimentações.</CardDescription>
                </div>
            </div>
             <div className="flex items-center gap-3 p-3 border rounded-lg w-full sm:w-auto">
                <Wallet className="h-7 w-7 text-primary" />
                <div>
                    <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                    <p className="text-2xl font-bold">{leadBalance} {leadBalance === 1 ? 'Lead' : 'Leads'}</p>
                </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  )
}
