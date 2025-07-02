'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Frown } from 'lucide-react';
import { useEffect } from 'react';

export default function NotFound() {
  // This effect is a workaround to remove the site-wide header and footer
  // specifically for the 404 page, as Next.js renders it within the root layout.
  // This might cause a brief flicker on page load.
  useEffect(() => {
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    if (header) header.style.display = 'none';
    if (footer) footer.style.display = 'none';
    
    // Cleanup function to restore header and footer when navigating away
    return () => {
      if (header) header.style.display = ''; // Let browser default/CSS handle it
      if (footer) footer.style.display = ''; // Let browser default/CSS handle it
    };
  }, []);

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
          <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit">
            <Frown className="h-12 w-12" />
          </div>
          <CardTitle className="font-headline text-3xl text-primary mt-4">
            Página Não Encontrada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Desculpe, a página que você acessou não existe.
          </p>
          <Button asChild>
            <Link href="/">Voltar para o Início</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
