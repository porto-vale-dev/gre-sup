
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function MuralDeAvisosPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/hub" passHref>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Hub
          </Button>
        </Link>
      </div>

      <div className="relative rounded-lg shadow-lg border overflow-hidden" style={{ height: '1200px' }}>
        <iframe
          title="Mural de Avisos"
          src="https://portovaleconsorcio.notion.site/ebd/95f9598f275c4089a845baa835679814"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full border-0"
        ></iframe>
      </div>
    </div>
  );
}
