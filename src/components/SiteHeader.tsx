"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Ticket as TicketIcon, UserCircle, Archive, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';
import Image from 'next/image';

// Import local images
import logoTicket from './logo_ticket_pv.webp';
import logoPortal from './logo_portal_pv.webp';

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
           <Link href="/">
              <Image
                src={logoPortal}
                alt="Portal Porto Vale Logo"
                width={160}
                height={56}
                priority
              />
          </Link>
        </div>
      </header>
    );
  }

  // Check if we are in the ticket system area, accounting for rewrites
  const isTicketSystemArea = pathname.startsWith('/suporte-gre') || pathname.startsWith('/dashboard');

  if (isTicketSystemArea) {
    const isTicketDashboardArea = pathname.startsWith('/suporte-gre/painel') || pathname.startsWith('/dashboard');
    const isArchivedPage = pathname === '/suporte-gre/painel/archived' || pathname === '/dashboard/archived';
    const isTicketFormPage = pathname === '/suporte-gre';

    // Header for Ticket System (Dashboard, Form)
    return (
      <header className="bg-card border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto h-20 flex items-center justify-between px-4 sm:px-6 md:px-8">
          <Link
            href={isAuthenticated ? "/suporte-gre/painel" : "/suporte-gre"}
            className="flex items-center gap-3 transition-colors"
            aria-label="TicketFlow Home"
          >
            <Image
              src={logoTicket}
              alt="TicketFlow Logo"
              width={130}
              height={45}
              priority
            />
          </Link>

          {!isLoading && (
            <nav className="flex items-center gap-1 sm:gap-2">
               {isAuthenticated && (
                  <>
                  {isTicketDashboardArea && (
                      <>
                      <Link href="/hub" passHref>
                          <Button variant="outline" size="sm" aria-label="Portal Principal">
                          <Home />
                          Portal
                          </Button>
                      </Link>
                      {isArchivedPage ? (
                      <Link href="/suporte-gre/painel" passHref>
                          <Button variant="ghost" size="sm" aria-label="Painel Principal">
                          <TicketIcon />
                          Painel
                          </Button>
                      </Link>
                      ) : (
                      <Link href="/suporte-gre/painel/archived" passHref>
                          <Button variant="ghost" size="sm" aria-label="Tickets Arquivados">
                          <Archive />
                          Arquivados
                          </Button>
                      </Link>
                      )}
                      </>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Sair da conta">
                    <LogOut />
                    Sair
                  </Button>
                </>
               )}
              {!isAuthenticated && isTicketFormPage && (
                <Link href="/suporte-gre/login" passHref>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <UserCircle />
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
         <Link href={isAuthenticated ? '/hub' : '/'}>
            <Image
              src={logoPortal}
              alt="Portal Porto Vale Logo"
              width={130}
              height={46}
              priority
            />
        </Link>

        {!isLoading && isAuthenticated && (
          <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground">Bem-vindo, {username || user?.email?.split('@')[0]}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Sair da conta">
                <LogOut />
                Sair
              </Button>
          </div>
        )}
      </div>
    </header>
  );
}
