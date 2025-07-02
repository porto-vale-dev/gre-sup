
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Ticket as TicketIcon, UserCircle, Archive, Home, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';

export function SiteHeader() {
  const pathname = usePathname();
  const { isAuthenticated, logout, isLoading, user, username } = useAuth();
  
  const handleLogout = () => {
    logout();
  };

  // Minimal header for the main login page
  if (pathname === '/') {
    return (
       <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto h-20 flex items-center justify-center px-4">
           <Link href="/" className="flex items-center gap-3 text-primary">
            <LayoutDashboard className="h-8 w-8" />
            <div className="flex flex-col leading-tight">
              <span className="text-2xl sm:text-3xl font-headline font-bold">Portal</span>
              <span className="text-sm font-normal opacity-90">Porto Vale</span>
            </div>
          </Link>
        </div>
      </header>
    );
  }

  // Check if we are in the ticket system area
  const isTicketSystemArea = pathname.startsWith('/suporte-gre');

  if (isTicketSystemArea) {
    const isTicketDashboardArea = pathname.startsWith('/suporte-gre/painel');
    const isArchivedPage = pathname === '/suporte-gre/painel/archived';
    const isTicketFormPage = pathname === '/suporte-gre';

    // Header for Ticket System (Dashboard, Form)
    return (
      <header className="bg-card border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto h-20 flex items-center justify-between px-4 sm:px-6 md:px-8">
          <Link
            href={isAuthenticated ? "/suporte-gre/painel" : "/suporte-gre"}
            className="flex items-center gap-3 text-primary transition-colors hover:text-primary/80"
            aria-label="Ticket Flow Home"
          >
            <TicketIcon className="h-8 w-8 sm:h-9 sm:w-9" />
            <div className="flex flex-col leading-tight">
              <span className="text-xl sm:text-2xl font-headline font-bold">Ticket Flow</span>
              <span className="text-xs font-normal opacity-90">Porto Vale</span>
            </div>
             {isAuthenticated && isTicketDashboardArea && (
              <span className="text-sm sm:text-base font-normal text-muted-foreground hidden md:inline ml-1">
                {isArchivedPage ? "- Arquivados" : "- Painel do Gestor"}
              </span>
            )}
          </Link>

          {!isLoading && (
            <nav className="flex items-center gap-1 sm:gap-2">
               {isAuthenticated && (
                  <>
                  {isTicketDashboardArea && (
                      <>
                      <Link href="/hub" passHref>
                          <Button variant="outline" size="sm" aria-label="Portal Principal">
                          <Home className="mr-1.5 h-4 w-4" />
                          Portal
                          </Button>
                      </Link>
                      {isArchivedPage ? (
                      <Link href="/suporte-gre/painel" passHref>
                          <Button variant="ghost" size="sm" aria-label="Painel Principal">
                          <TicketIcon className="mr-1.5 h-4 w-4" />
                          Painel
                          </Button>
                      </Link>
                      ) : (
                      <Link href="/suporte-gre/painel/archived" passHref>
                          <Button variant="ghost" size="sm" aria-label="Tickets Arquivados">
                          <Archive className="mr-1.5 h-4 w-4" />
                          Arquivados
                          </Button>
                      </Link>
                      )}
                      </>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Sair da conta">
                    <LogOut className="mr-1.5 h-4 w-4" />
                    Sair
                  </Button>
                </>
               )}
              {!isAuthenticated && isTicketFormPage && (
                <Link href="/suporte-gre/login" passHref>
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
  
  // Default Header for Portal Area (Hub, Rankings, Mural, 404, etc.)
  return (
    <header className="bg-card border-b sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto h-20 flex items-center justify-between px-4 sm:px-6 md:px-8">
         <Link href={isAuthenticated ? '/hub' : '/'} className="flex items-center gap-3 text-primary">
          <LayoutDashboard className="h-8 w-8" />
          <div className="flex flex-col leading-tight">
            <span className="text-2xl sm:text-3xl font-headline font-bold">Portal</span>
            <span className="text-sm font-normal opacity-90">Porto Vale</span>
          </div>
        </Link>

        {!isLoading && isAuthenticated && (
          <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground">Bem-vindo, {username || user?.email?.split('@')[0]}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Sair da conta">
                <LogOut className="mr-1.5 h-4 w-4" />
                Sair
              </Button>
          </div>
        )}
      </div>
    </header>
  );
}
