
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Frown } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem-theme(spacing.20))]">
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
