
'use client'

import { useState, useEffect } from 'react'
import { products as staticProducts } from '@/lib/productsData'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ShoppingCart, Minus, Plus, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabaseClient'
import { Skeleton } from '@/components/ui/skeleton'

type Product = (typeof staticProducts)[0] & { id?: string, description?: string | null };

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { addToCart } = useCart()
  const router = useRouter()
  const { toast } = useToast()

  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined)
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined)

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      // First, check static products
      let foundProduct: Product | null = staticProducts.find((p) => p.slug === slug) || null;

      // If not found in static, check dynamic products from Supabase
      if (!foundProduct) {
        const { data, error } = await supabase
          .from('produtos')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "exact one row not found"
          console.error("Error fetching dynamic product:", error);
        }
        if (data) {
          foundProduct = data as Product;
        }
      }

      setProduct(foundProduct);
      setIsLoading(false);
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  if (isLoading) {
    return (
        <div className="container mx-auto px-4 md:px-6 py-8">
            <Skeleton className="h-10 w-48 mb-6" />
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                <Skeleton className="w-full h-[500px] rounded-lg" />
                <div className="flex flex-col justify-center space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-6 w-1/3" />
                    <div className="flex gap-4 pt-4">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                    <Skeleton className="h-12 w-full pt-4" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        </div>
    );
  }

  if (!product) {
    notFound()
  }
  
  const isCustomizable = product.slug === 'baby-look' || product.slug === 'camisa-polo' || (product.id && (product.description === null || product.description === ''));
  const priceInLeads = Math.ceil(product.price / 15);
  const description = product.description || `Descrição detalhada para o produto ${product.name}. Este espaço pode ser usado para fornecer mais informações sobre o material, dimensões, cuidados e outros detalhes importantes.`;

  const handleAddToCart = (buyNow = false) => {
    if (isCustomizable) {
        if (!selectedSize) {
            toast({
                title: "Tamanho necessário",
                description: "Por favor, selecione um tamanho.",
                variant: "destructive",
            });
            return;
        }
        if (!selectedColor) {
            toast({
                title: "Cor necessária",
                description: "Por favor, selecione uma cor.",
                variant: "destructive",
            });
            return;
        }
    }
    
    addToCart(product, quantity, selectedSize, selectedColor);

    toast({
      title: "Produto adicionado!",
      description: `${quantity}x ${product.name} ${selectedSize || ''} ${selectedColor || ''} foi adicionado ao seu carrinho.`.trim(),
    });

    if (buyNow) {
      router.push('/lead-bank/cart');
    }
  }


  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
       <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/lead-bank">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a loja
          </Link>
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="flex items-center justify-center">
            <div className="relative w-full h-[500px] rounded-lg overflow-hidden">
                <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain"
                />
            </div>
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>
          <p className="text-3xl font-bold text-primary mb-2">
            R$ {product.price.toFixed(2).replace('.', ',')} ou {priceInLeads} {priceInLeads === 1 ? 'Lead' : 'Leads'}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Em até 1x de R$ {product.price.toFixed(2).replace('.', ',')} sem juros
          </p>

          {isCustomizable && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                    <Label htmlFor="size-select">Tamanho</Label>
                    <Select value={selectedSize} onValueChange={setSelectedSize}>
                        <SelectTrigger id="size-select" className="w-full">
                        <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="p">P</SelectItem>
                        <SelectItem value="m">M</SelectItem>
                        <SelectItem value="g">G</SelectItem>
                        <SelectItem value="gg">GG</SelectItem>
                        <SelectItem value="xgg">XGG</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Cor</Label>
                    <RadioGroup
                        value={selectedColor}
                        onValueChange={setSelectedColor}
                        className="flex gap-2 items-center"
                    >
                        <Label htmlFor="color-azul" className={cn("h-8 w-8 rounded-full border-2 cursor-pointer", selectedColor === 'azul' && 'ring-2 ring-offset-2 ring-blue-500')} style={{backgroundColor: '#3b82f6'}} title="Azul"></Label>
                        <RadioGroupItem value="azul" id="color-azul" className="sr-only" />

                        <Label htmlFor="color-branca" className={cn("h-8 w-8 rounded-full border-2 cursor-pointer", selectedColor === 'branca' && 'ring-2 ring-offset-2 ring-stone-500')} style={{backgroundColor: '#ffffff'}} title="Branca"></Label>
                        <RadioGroupItem value="branca" id="color-branca" className="sr-only" />
                        
                        <Label htmlFor="color-preto" className={cn("h-8 w-8 rounded-full border-2 cursor-pointer", selectedColor === 'preto' && 'ring-2 ring-offset-2 ring-gray-800')} style={{backgroundColor: '#000000'}} title="Preto"></Label>
                        <RadioGroupItem value="preto" id="color-preto" className="sr-only" />
                    </RadioGroup>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4 mb-6">
            <Label>Quantidade</Label>
            <div className="flex items-center border rounded-md">
              <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="h-9 w-9">
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center font-medium">{quantity}</span>
              <Button variant="ghost" size="icon" onClick={() => setQuantity(q => q + 1)} className="h-9 w-9">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>


          <div className="flex flex-col gap-2">
            <Button size="lg" onClick={() => handleAddToCart(true)}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                Comprar
            </Button>
            <Button size="lg" variant="outline" onClick={() => handleAddToCart(false)}>
                Adicionar ao Carrinho
            </Button>
          </div>
          <div className="mt-8">
            <h3 className="font-semibold text-lg mb-2">Descrição</h3>
            <p className="text-muted-foreground">
                {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

    