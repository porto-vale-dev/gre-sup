
'use client'

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { products as staticProducts } from '@/lib/productsData'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/hooks/use-toast'
import { Search, Wallet, FileText, Settings, PlusCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { Skeleton } from '@/components/ui/skeleton'

type Product = typeof staticProducts[0] & { id?: string; created_at?: string; image: string; };

export default function LeadBankPage() {
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const { addToCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const { cargo, username, leadBalance, refreshLeadBalance } = useAuth();
  
  const [dynamicProducts, setDynamicProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const canViewAdmin = cargo && ['adm'].includes(cargo);

  useEffect(() => {
    refreshLeadBalance();
    
    const fetchProducts = async () => {
        setIsLoadingProducts(true);
        const { data, error } = await supabase.from('produtos').select('*');
        if (error) {
            toast({
                title: 'Erro ao buscar produtos',
                description: 'Não foi possível carregar os produtos dinâmicos.',
                variant: 'destructive',
            });
        } else {
            setDynamicProducts(data || []);
        }
        setIsLoadingProducts(false);
    };

    fetchProducts();
  }, [refreshLeadBalance, toast]);


  const handleBuyNow = (product: Product) => {
     if (product.slug === 'baby-look' || product.slug === 'camisa-polo' || (product.id && product.slug)) {
      router.push(`/lead-bank/${product.slug}`);
    } else {
      addToCart(product, 1);
      toast({
        title: "Produto adicionado!",
        description: `1x ${product.name} foi adicionado ao seu carrinho.`,
      });
      router.push('/lead-bank/cart');
    }
  };
  
  const saldoDisponivelEmLeads = leadBalance;

  const allProducts = useMemo(() => {
    return [...staticProducts, ...dynamicProducts];
  }, [dynamicProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = allProducts.filter(product => {
      const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
      const searchMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      return priceMatch && searchMatch;
    });

    if (sortBy === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    }
    // 'relevance' (default) doesn't need a specific sort here, it will use the original order.

    return filtered;
  }, [allProducts, priceRange, searchTerm, sortBy]);


  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
       <header className="mb-8 space-y-4">
        <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <Wallet className="h-8 w-8 text-primary" />
                <div>
                    <p className="text-sm text-muted-foreground">Olá {username || 'Usuário'}, seu Saldo Lead Bank:</p>
                    <p className="text-xl font-bold">{saldoDisponivelEmLeads} {saldoDisponivelEmLeads === 1 ? 'Lead' : 'Leads'}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <Link href="/lead-bank/extrato">
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Extrato
                    </Link>
                </Button>
            </div>
        </Card>
         <div className="flex justify-between items-center gap-4 pt-4">
            <h1 className="text-3xl font-bold text-foreground whitespace-nowrap">Acessórios</h1>
            {canViewAdmin && (
                <div className="flex gap-2">
                    <Button asChild variant="secondary" size="sm" className="w-full sm:w-auto">
                        <Link href="/lead-bank/admin">
                            <Settings className="h-4 w-4 mr-2" />
                            Administração
                        </Link>
                    </Button>
                    <Button asChild variant="default" size="sm" className="w-full sm:w-auto">
                        <Link href="/lead-bank/admin/products">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Gerenciar Produtos
                        </Link>
                    </Button>
                </div>
            )}
         </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="md:col-span-1">
          <div className="sticky top-24">
            <h2 className="text-2xl font-semibold mb-4">Filtros</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Faixas de preço</h3>
                <Slider
                  defaultValue={[0, 500]}
                  max={500}
                  step={1}
                  value={priceRange}
                  onValueChange={setPriceRange}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  R$ {priceRange[0].toFixed(2)} - R$ {priceRange[1].toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="md:col-span-3">
           <div className="mb-6">
               <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar produtos..."
                        className="pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
           </div>

          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-muted-foreground">{filteredProducts.length} PRODUTOS</p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevância</SelectItem>
                <SelectItem value="price-asc">Menor Preço</SelectItem>
                <SelectItem value="price-desc">Maior Preço</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingProducts ? (
              [...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden group flex flex-col">
                  <Skeleton className="h-[250px] w-full" />
                  <CardContent className="p-4 flex-grow flex flex-col">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                  <CardFooter className="p-4 pt-0 mt-auto">
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : (
              <>
                {filteredProducts.map((product) => {
                  const priceInLeads = Math.ceil(product.price / 15);
                  return (
                    <Card key={product.id || product.slug} className="overflow-hidden group flex flex-col">
                      <Link href={`/lead-bank/${product.slug}`} className="block">
                          <div className="bg-card flex items-center justify-center cursor-pointer rounded-t-lg overflow-hidden">
                              <div className="relative w-full h-[250px]">
                                  <Image
                                    src={product.image.trim()}
                                    alt={product.name}
                                    fill
                                    className="p-4 object-contain"
                                  />
                              </div>
                          </div>
                        </Link>
                      <CardContent className="p-4 flex-grow flex flex-col">
                        <div className="flex-grow">
                          <Link href={`/lead-bank/${product.slug}`}>
                              <h3 className="font-semibold text-lg mb-2 h-14 hover:underline">{product.name}</h3>
                          </Link>
                          <p className="text-xl font-bold text-primary">R$ {product.price.toFixed(2).replace('.',',')} ou {priceInLeads} {priceInLeads === 1 ? 'Lead' : 'Leads'}</p>
                          <p className="text-xs text-muted-foreground">Em até 1x R$ {product.price.toFixed(2).replace('.',',')} sem juros</p>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 mt-auto">
                        <Button className="w-full" onClick={() => handleBuyNow(product)}>Comprar</Button>
                      </CardFooter>
                    </Card>
                  )
                })}
                {filteredProducts.length === 0 && (
                    <div className="sm:col-span-2 lg:col-span-3 text-center py-12">
                        <p className="text-muted-foreground">Nenhum produto encontrado com os filtros aplicados.</p>
                    </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

    