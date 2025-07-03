'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function DiretorPage() {
  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-10rem)]">
      <div>
        <Link href="/rankings" passHref>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Rankings
          </Button>
        </Link>
      </div>

      {/* Container responsivo para o iframe */}
      <div className="relative flex-grow rounded-lg shadow-lg border overflow-hidden">
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
