
'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from '@/components/ui/label'
import { Trash2, ArrowLeft, Minus, Plus, Loader2, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function CartPage() {
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    subtotal,
    itemCount,
    clearCart
  } = useCart()
  const { toast } = useToast()
  const { user, leadBalance, refreshLeadBalance } = useAuth(); // Get the authenticated user, lead balance and refresh function

  const [pickupLocation, setPickupLocation] = useState('sjc');
  const [useLeadBank, setUseLeadBank] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingPayroll, setIsConfirmingPayroll] = useState(false);
  
  const saldoDisponivelEmLeads = leadBalance;
  const subtotalEmLeads = Math.ceil(subtotal / 15);

  const valorPagoComSaldoEmLeads = useLeadBank ? Math.min(subtotalEmLeads, saldoDisponivelEmLeads) : 0;
  const valorDescontoFolhaEmLeads = subtotalEmLeads - valorPagoComSaldoEmLeads;
  const valorDescontoFolhaEmReais = useLeadBank ? valorDescontoFolhaEmLeads * 15 : subtotal;


  const processOrder = async () => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      if (!currentUser || !currentUser.email) {
        toast({
          title: "Erro de Autenticação",
          description: "Sessão expirada. Por favor, faça login novamente para finalizar o pedido.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
    
      const orderItems = items.map(item => {
        let tamanhoInfo = item.size || null;
        if (item.size && item.color) {
            tamanhoInfo = `${item.size.toUpperCase()} / ${item.color.charAt(0).toUpperCase() + item.color.slice(1)}`;
        } else if (item.size) {
            tamanhoInfo = item.size.toUpperCase();
        }

        return {
            produto: item.product.name,
            quantidade: item.quantity,
            total: item.product.price * item.quantity,
            tamanho: tamanhoInfo,
            retirada: pickupLocation,
            folha: valorDescontoFolhaEmReais > 0,
            user_id: currentUser.id,
            email: currentUser.email,
        };
      });

      // 1. Insere o registro da compra na tabela 'compras'
      const { error: comprasError } = await supabase.from('compras').insert(orderItems);
      if (comprasError) throw comprasError;
      
      // 2. Se leads foram usados, insere um registro de débito na 'lead_bank'
      if (useLeadBank && valorPagoComSaldoEmLeads > 0) {
        const { error: leadBankError } = await supabase.from('lead_bank').insert({
          email: currentUser.email,
          nome: user?.user_metadata.username || currentUser.email.split('@')[0],
          quantidade_lead: -valorPagoComSaldoEmLeads, // <-- Valor negativo para débito
          descricao_padrao: `Compra de ${itemCount} item(s) na loja`,
          observacao: `Subtotal: R$ ${subtotal.toFixed(2)}`,
        });

        if (leadBankError) {
            // Tenta reverter a situação ou notificar sobre a inconsistência
            console.error("Error inserting debit into lead_bank:", leadBankError);
            toast({
                title: "Atenção: Erro ao Deduzir Leads",
                description: `Sua compra foi registrada, mas houve um problema ao atualizar seu saldo de leads. Por favor, contate o suporte.`,
                variant: "destructive",
                duration: 10000,
            });
             // Mesmo com erro no débito, continuamos para não perder a compra. O admin pode ajustar manualmente.
        }
      }

      toast({
        title: "Pedido Finalizado!",
        description: "Sua compra foi registrada com sucesso. Em breve, entraremos em contato.",
      });
      clearCart();
      await refreshLeadBalance(); // Refresh balance after order

    } catch (error: any) {
      console.error("Error finalizing order:", error);
      toast({
        title: "Erro ao Finalizar Pedido",
        description: `Não foi possível registrar sua compra. Por favor, tente novamente. Detalhes: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsConfirmingPayroll(false);
    }
  };

  const handleFinalizeOrder = () => {
    if (!useLeadBank && subtotal > 0) {
      setIsConfirmingPayroll(true);
    } else {
      processOrder();
    }
  };


  return (
    <>
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <Button asChild variant="outline">
            <Link href="/lead-bank">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continuar Comprando
            </Link>
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold mb-6">Carrinho de Compras</h1>

        {itemCount === 0 ? (
          <Card className="text-center py-12">
              <CardContent>
                  <h2 className="text-2xl font-semibold mb-2">Seu carrinho está vazio</h2>
                  <p className="text-muted-foreground mb-6">Adicione produtos para vê-los aqui.</p>
                  <Button asChild>
                      <Link href="/lead-bank">Ir para a Loja</Link>
                  </Button>
              </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px] hidden md:table-cell">Item</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="hidden md:table-cell">
                          <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted">
                            <Image src={item.product.image} alt={item.product.name} layout="fill" objectFit="cover" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{item.product.name}</p>
                          <div className="text-sm text-muted-foreground">
                              {item.size && <span>Tamanho: {item.size.toUpperCase()}</span>}
                              {item.size && item.color && ' / '}
                              {item.color && <span>Cor: {item.color.charAt(0).toUpperCase() + item.color.slice(1)}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center border rounded-md w-fit">
                              <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-8 w-8">
                                  <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-8 w-8">
                                  <Plus className="h-4 w-4" />
                              </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <CardFooter className="justify-end p-6">
                  <div className="text-lg font-medium">
                      SUBTOTAL: R$ {subtotal.toFixed(2).replace('.', ',')} ou {subtotalEmLeads} {subtotalEmLeads === 1 ? 'Lead' : 'Leads'}
                  </div>
                </CardFooter>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo</CardTitle>
                  <CardDescription>Finalize seu pedido</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                      <Label className="font-semibold">Local de Retirada</Label>
                      <RadioGroup value={pickupLocation} onValueChange={setPickupLocation} className="mt-2 space-y-1">
                          <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sjc" id="sjc" />
                          <Label htmlFor="sjc">São José dos Campos</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sp" id="sp" />
                          <Label htmlFor="sp">São Paulo</Label>
                          </div>
                      </RadioGroup>
                  </div>
                  
                  <div>
                      <Label className="font-semibold">Forma de Pagamento</Label>
                      <div className="mt-2 space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="use-lead-bank"
                            checked={useLeadBank}
                            onCheckedChange={(checked) => setUseLeadBank(Boolean(checked))}
                            disabled={saldoDisponivelEmLeads <= 0}
                          />
                          <Label htmlFor="use-lead-bank" className="font-normal">
                            Pagar com Saldo Lead Bank
                          </Label>
                        </div>
                      </div>
                  </div>

                  <div className="border-t pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Saldo Disponível:</span>
                      <span className="font-medium">{saldoDisponivelEmLeads} {saldoDisponivelEmLeads === 1 ? 'Lead' : 'Leads'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span>Pago com Saldo:</span>
                      <span className="font-medium text-green-600">- {valorPagoComSaldoEmLeads} {valorPagoComSaldoEmLeads === 1 ? 'Lead' : 'Leads'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>A descontar em folha:</span>
                      <span className="font-medium">R$ {valorDescontoFolhaEmReais.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-lg font-bold border-t pt-4">
                    <span>TOTAL A PAGAR:</span>
                    {!useLeadBank ? (
                        <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                    ) : (
                        <span>{subtotalEmLeads} {subtotalEmLeads === 1 ? 'Lead' : 'Leads'}</span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-4">
                  <Button className="w-full" size="lg" onClick={handleFinalizeOrder} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Finalizando..." : "Finalizar Pedido"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={isConfirmingPayroll} onOpenChange={setIsConfirmingPayroll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              Confirmar Desconto em Folha
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você não selecionou o pagamento com saldo Lead Bank. O valor total de <strong>R$ {subtotal.toFixed(2).replace('.', ',')}</strong> será descontado diretamente da sua folha de pagamento.
              <br /><br />
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={processOrder} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar e Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
