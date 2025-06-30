
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function GerentePage() {
  return (
    <div>
      <Link href="/hub" passHref>
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Hub
        </Button>
      </Link>
      <h1 className="text-3xl font-bold">Ranking Gerente</h1>
      <p className="mt-4 text-muted-foreground">Página em construção. Volte em breve para mais detalhes.</p>
    </div>
  );
}
