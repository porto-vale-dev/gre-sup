
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Expand, Shrink } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MuralDeAvisosPage() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 h-[calc(100vh-12rem)] transition-all duration-300",
        isExpanded && "fixed inset-0 z-50 bg-background p-4 h-screen"
      )}
    >
      <div className="flex items-center justify-between">
        <Link href="/hub" passHref>
          <Button variant="outline" size="sm" className={cn(isExpanded && "hidden")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Hub
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-auto"
        >
          {isExpanded ? (
            <>
              <Shrink className="mr-2 h-4 w-4" /> Recolher
            </>
          ) : (
            <>
              <Expand className="mr-2 h-4 w-4" /> Expandir
            </>
          )}
        </Button>
      </div>

      <div className="relative flex-grow rounded-lg shadow-lg border overflow-hidden bg-white">
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
