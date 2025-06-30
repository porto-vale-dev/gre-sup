
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function DiretorPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/rankings" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Rankings
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-primary">Ranking Diretor</h1>
      
      {/* Container responsivo para o iframe */}
      <div className="relative h-0 overflow-hidden rounded-lg shadow-lg border" style={{ paddingBottom: '56.25%' /* Proporção 16:9 */ }}>
        <iframe
          title="Porto Vale - Geral"
          src="https://app.powerbi.com/view?r=eyJrIjoiMTFlMzc4NzktYTJhNy00OTkxLWIyOGQtOTJkMjM5NDc4MjFhIiwidCI6IjUzNDU4MDVjLTNiZjQtNDgzNS05YTc5LWQxNzVkOTEyZjljYyJ9"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full border-0"
        ></iframe>
      </div>
    </div>
  );
}
