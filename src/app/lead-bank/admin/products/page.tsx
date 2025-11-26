
'use client'

import { useState, useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { PlusCircle, List, ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { addProductAction, deleteProduct } from '@/actions/productActions'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'

const productSchema = z.object({
  name: z.string().min(1, 'Nome do produto é obrigatório'),
  price: z.preprocess(
    (val) => String(val).replace(',', '.'),
    z.coerce.number().min(0.01, 'Preço deve ser maior que zero')
  ),
  description: z.string().optional(),
  image: z.instanceof(FileList)
    .refine(files => files?.length == 1, 'Imagem é obrigatória.')
    .refine(files => files?.[0]?.size <= 5 * 1024 * 1024, `Tamanho máximo é 5MB.`)
    .refine(
      files => ['image/jpeg', 'image/png', 'image/webp'].includes(files?.[0]?.type),
      'Apenas formatos .jpg, .png e .webp são suportados.'
    ),
})

type ProductFormData = z.infer<typeof productSchema>

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

export default function AdminProductsPage() {
  const { toast } = useToast()
  const { cargo } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  const fetchProducts = async () => {
    setIsLoadingProducts(true)
    const { data, error } = await supabase
      .from('produtos')
      .select('id, name, price, image')
      .order('created_at', { ascending: false })
      
    if (error) {
      toast({
        title: 'Erro ao buscar produtos',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      setProducts(data as Product[])
    }
    setIsLoadingProducts(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [toast])


  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    setIsSubmitting(true)
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'image' && value instanceof FileList) {
        formData.append(key, value[0])
      } else {
        formData.append(key, String(value))
      }
    })

    const result = await addProductAction(formData)

    toast({
      title: result.success ? 'Sucesso!' : 'Erro ao Adicionar Produto',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    })

    if (result.success) {
      form.reset()
      await fetchProducts()
    }
    setIsSubmitting(false)
  }
  
  const handleDeleteProduct = async (productId: string, imagePath: string) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    const result = await deleteProduct(productId, imagePath);
    toast({
        title: result.success ? 'Produto Excluído' : 'Erro ao Excluir',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
    });

    if (result.success) {
        await fetchProducts();
    }
};


  if (cargo !== 'adm') {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Acesso negado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciamento de Produtos</h1>
        <Button asChild variant="outline">
          <Link href="/lead-bank">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a Loja
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle /> Adicionar Novo Produto
            </CardTitle>
            <CardDescription>
              Preencha o formulário para cadastrar um novo item na loja.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="name">Nome do Produto</label>
                <Input id="name" {...form.register('name')} placeholder="Ex: Caneca Personalizada" />
                {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="price">Preço (R$)</label>
                <Input id="price" type="text" {...form.register('price')} placeholder="Ex: 25,00" />
                {form.formState.errors.price && <p className="text-sm text-destructive mt-1">{form.formState.errors.price.message}</p>}
              </div>
              <div>
                <label htmlFor="description">Descrição</label>
                <Textarea id="description" {...form.register('description')} placeholder="Detalhes sobre o produto (opcional)" />
                 {form.formState.errors.description && <p className="text-sm text-destructive mt-1">{form.formState.errors.description.message}</p>}
              </div>
              <div>
                <label htmlFor="image">Imagem do Produto</label>
                <Input id="image" type="file" {...form.register('image')} accept="image/jpeg,image/png,image/webp" />
                 {form.formState.errors.image && <p className="text-sm text-destructive mt-1">{form.formState.errors.image.message}</p>}
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar Produto
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List /> Produtos Cadastrados
            </CardTitle>
            <CardDescription>
              Lista de todos os produtos atualmente na loja.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProducts ? (
              <p>Carregando produtos...</p>
            ) : (
              <div className="space-y-4">
                 {products.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-4">
                          <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted">
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-sm text-muted-foreground">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id, product.image)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
                {products.length === 0 && <p className="text-center text-muted-foreground">Nenhum produto cadastrado.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

    