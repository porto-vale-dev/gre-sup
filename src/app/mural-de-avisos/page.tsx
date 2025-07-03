"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

const MuralSkeleton = () => (
    <div className="flex flex-col gap-4 h-[calc(100vh-12rem)]">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="flex-grow rounded-lg" />
    </div>
);

export default function MuralDeAvisosPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return <MuralSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-12rem)]">
      <div>
        <Link href="/hub" passHref>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Hub
          </Button>
        </Link>
      </div>

      <div className="relative flex-grow rounded-lg shadow-lg border overflow-hidden">
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
