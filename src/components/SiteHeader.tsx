
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Ticket as TicketIcon, UserCircle, Archive, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function SiteHeader() {
  const pathname = usePathname();
  const { isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isDashboardArea = pathname.startsWith('/dashboard');
  const isArchivedPage = pathname === '/dashboard/archived';
  const isMainDashboardPage = pathname === '/dashboard';

  // On login page, show a simplified header
  if (pathname === '/login') {
    return (
       <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto h-20 flex items-center justify-center px-4">
           <Link href="/" className="flex items-center gap-3 text-3xl font-headline font-bold text-primary">
            <TicketIcon className="h-8 w-8" />
            <span>Tickets - Porto Vale Consórcio</span>
          </Link>
        </div>
      </header>
    );
  }

  // For other pages, show the full header
  return (
    <header className="bg-card border-b sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto h-20 flex items-center justify-between px-4 sm:px-6 md:px-8">
        <Link 
          href={!isLoading && isAuthenticated && isDashboardArea ? "/dashboard" : "/"} 
          className="flex items-center gap-2 text-xl sm:text-2xl font-headline font-bold text-primary transition-colors hover:text-primary/80"
          aria-label="Tickets - Porto Vale Consórcio Home"
        >
          <TicketIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          <span>Tickets - Porto Vale Consórcio</span>
           {!isLoading && isAuthenticated && isDashboardArea && (
            <span className="text-sm sm:text-base font-normal text-muted-foreground hidden md:inline">
              {isArchivedPage ? "- Arquivados" : "- Painel do Gestor"}
            </span>
          )}
        </Link>
        
        {!isLoading && (
          <nav className="flex items-center gap-1 sm:gap-2">
            {isAuthenticated && isDashboardArea && (
              <>
                {isArchivedPage ? (
                  <Link href="/dashboard" passHref>
                    <Button variant={isMainDashboardPage ? "secondary" : "ghost"} size="sm" aria-label="Painel Principal">
                      <Home className="mr-1.5 h-4 w-4" />
                      Painel Principal
                    </Button>
                  </Link>
                ) : (
                  <Link href="/dashboard/archived" passHref>
                    <Button variant={isArchivedPage ? "secondary" : "ghost"} size="sm" aria-label="Tickets Arquivados">
                      <Archive className="mr-1.5 h-4 w-4" />
                      Arquivados
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Sair da conta">
                  <LogOut className="mr-1.5 h-4 w-4" />
                  Sair
                </Button>
              </>
            )}
            {isAuthenticated && !isDashboardArea && ( // User is authenticated but on home page
                 <Link href="/dashboard" passHref>
                    <Button variant="outline" size="sm">
                        Painel do Gestor
                    </Button>
                </Link>
            )}
            {!isAuthenticated && pathname === '/' && (
              <Link href="/login" passHref>
                <Button variant="outline" size="sm" className="rounded-full">
                  <UserCircle className="mr-1.5 h-4 w-4" />
                  Acesso Restrito
                </Button>
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
