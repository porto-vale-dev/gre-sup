
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Service {
  title: string;
  href: string;
  Icon: LucideIcon;
  description: string;
}

const services: Service[] = [
    { title: "Rankings", href: "/rankings", Icon: Trophy, description: "Acesse os rankings de desempenho." },
];

const ServiceCard = ({ service }: { service: Service }) => (
  <Link href={service.href} className="group block">
    <Card className="h-full hover:border-primary hover:shadow-lg transition-all duration-300 flex flex-col">
      <CardContent className="p-6 flex flex-col items-start gap-4 flex-grow">
        <div className="flex justify-between items-center w-full">
            <div className="bg-primary/10 text-primary p-3 rounded-lg">
                <service.Icon className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-card-foreground">{service.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
        </div>
      </CardContent>
    </Card>
  </Link>
);


const HubSkeleton = () => (
    <div className="space-y-8">
        <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-6 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-6 max-w-sm mx-auto">
            {[...Array(1)].map((_, i) => (
                <Card key={i} className="h-full">
                    <CardContent className="p-6 flex flex-col items-start gap-4">
                        <div className="flex justify-between items-center w-full">
                           <Skeleton className="h-12 w-12 rounded-lg" />
                           <Skeleton className="h-5 w-5 rounded-full" />
                        </div>
                        <div>
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
);


export default function HubPage() {
    const { isAuthenticated, isLoading, user, cargo } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading || !isAuthenticated) {
        return <HubSkeleton />;
    }
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline text-primary">Hub de Serviços</h1>
                <p className="text-muted-foreground mt-1">Selecione um serviço para continuar.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 max-w-sm mx-auto">
                {services.map(service => (
                    <ServiceCard key={service.href} service={service} />
                ))}
            </div>
        </div>
    )
}
