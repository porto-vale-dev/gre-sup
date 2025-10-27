
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Home, LayoutDashboard, Settings, UserCircle, Handshake, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Ticket as TicketIcon } from 'lucide-react';
import { NotificationBell } from './NotificationBell';


// Import local images
import logoTicket from './logo_ticket_pv.webp';
import logoPortal from './logo_portal_pv.webp';

export function SiteHeader() {
  const pathname = usePathname();
  const { isAuthenticated, logout, isLoading, user, username, cargo, email } = useAuth();
  
  const handleLogout = () => {
    logout();
  };

  const capitalizeFirstLetter = (string: string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const displayName = capitalizeFirstLetter(username || user?.email?.split('@')[0] || '');
  const avatarFallback = displayName ? displayName.charAt(0) : <UserCircle className="h-6 w-6" />;
  
  // Custom display cargo for specific user
  let displayCargo = cargo;
  if (email === 'naira.nunes@portovaleconsorcios.com.br') {
      displayCargo = 'Eagles';
  } else if (email === 'aprendiz.gre@portovaleconsorcios.com.br') {
      displayCargo = null; // Oculta o cargo
  }

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
                style={{ height: 'auto', width: 'auto' }}
              />
          </Link>
        </div>
      </header>
    );
  }

  // Check if we are in the ticket system area, accounting for rewrites
  const isTicketSystemArea = pathname.startsWith('/suporte-gre') || pathname.startsWith('/dashboard') || pathname.startsWith('/pos-contemplacao');


  if (isTicketSystemArea) {
    const isTicketDashboardArea = pathname.startsWith('/suporte-gre/painel') || pathname.startsWith('/dashboard');
    const isCobrancaDashboardArea = pathname.startsWith('/suporte-gre/cobranca/dashboard');
    const isCobrancaGestaoArea = pathname === '/suporte-gre/cobranca/gestao';
    const isCobrancaArchivedArea = pathname.startsWith('/suporte-gre/cobranca/archived');
    const isCobrancaNovoArea = pathname === '/suporte-gre/cobranca/novo';
    const isArchivedPage = pathname === '/suporte-gre/painel/archived' || pathname === '/dashboard/archived';
    const isGestaoPage = pathname === '/suporte-gre/gestao';
    const isConfiguracoesPage = pathname === '/suporte-gre/configuracoes';
    
    const isPosContemplacaoDashboard = pathname.startsWith('/pos-contemplacao/dashboard');
    const isPosContemplacaoGestao = pathname === '/pos-contemplacao/gestao';
    const isPosContemplacaoNovo = pathname === '/pos-contemplacao/novo';
    const isPosContemplacaoArchived = pathname === '/pos-contemplacao/archived';
    
    const allowedManagementRoles = ['adm', 'greadmin', 'greadminsa', 'gre', 'grea', 'gre_apoio_admin'];
    const canViewManagement = cargo && allowedManagementRoles.includes(cargo);

    const allowedSettingsRoles = ['adm', 'greadmin', 'greadminsa', 'gre', 'grea'];
    const canViewSettings = cargo && allowedSettingsRoles.includes(cargo);
    
    const posContemplacaoGestaoRoles = ['adm', 'greadmin', 'gre_con_admin'];
    const canViewPosContemplacaoGestao = cargo && posContemplacaoGestaoRoles.includes(cargo);

    const cobrancaGestaoRoles = ['adm', 'greadmin', 'greadminsa', 'gre_apoio_admin'];
    const canViewCobrancaGestao = cargo && cobrancaGestaoRoles.includes(cargo);
    
    const isCobrancaArea = pathname.includes('/cobranca/');
    const isPosContemplacaoArea = pathname.includes('/pos-contemplacao/');
    
    let logoLink = '/suporte-gre/painel'; // Default to GRE support panel
    if (isCobrancaArea) {
        logoLink = '/suporte-gre/cobranca/dashboard';
    } else if (isPosContemplacaoArea) {
        logoLink = '/pos-contemplacao/dashboard';
    }


    // Header for Ticket System (Dashboard, Form)
    return (
      <header className="bg-card border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto h-20 flex items-center justify-between px-4 sm:px-6 md:px-8">
          <Link
            href={logoLink}
            className="flex items-center gap-3 transition-colors"
            aria-label="TicketFlow Home"
          >
            <Image
              src={logoTicket}
              alt="TicketFlow Logo"
              width={149}
              priority
              style={{ height: 'auto', width: 'auto' }}
            />
          </Link>

          {!isLoading && isAuthenticated && (
            <nav className="flex items-center gap-1 sm:gap-2">
              <NotificationBell />
               {(isArchivedPage || isGestaoPage || isConfiguracoesPage) && (
                 <Link href="/dashboard" passHref>
                  <Button variant="ghost" size="sm" aria-label="Painel de Tickets">
                    <TicketIcon className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Painel de Tickets</span>
                  </Button>
                </Link>
              )}
               {(isCobrancaArchivedArea || isCobrancaNovoArea || isCobrancaGestaoArea) && (
                 <Link href="/suporte-gre/cobranca/dashboard" passHref>
                  <Button variant="ghost" size="sm" aria-label="Painel Apoio Jacareí">
                    <Handshake className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Painel Apoio Jacareí</span>
                  </Button>
                </Link>
              )}
              {(isPosContemplacaoGestao || isPosContemplacaoNovo || isPosContemplacaoArchived) && (
                  <Link href="/pos-contemplacao/dashboard" passHref>
                      <Button variant="ghost" size="sm" aria-label="Painel Pós-Contemplação">
                          <LayoutDashboard className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Painel Pós-Contemplação</span>
                      </Button>
                  </Link>
              )}
               {isCobrancaDashboardArea && canViewCobrancaGestao && (
                 <Link href="/suporte-gre/cobranca/gestao" passHref>
                  <Button variant="ghost" size="sm" aria-label="Gestão de Apoio">
                    <BarChart2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Gestão de Apoio</span>
                  </Button>
                </Link>
              )}
              {isTicketDashboardArea && canViewManagement && !isArchivedPage && !isGestaoPage && !isConfiguracoesPage && email !== 'aprendiz.gre@portovaleconsorcios.com.br' && (
                <Link href="/suporte-gre/gestao" passHref>
                  <Button variant="ghost" size="sm" aria-label="Gestão de Suporte">
                    <LayoutDashboard className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Gestão</span>
                  </Button>
                </Link>
              )}
              {isPosContemplacaoDashboard && canViewPosContemplacaoGestao && (
                 <Link href="/pos-contemplacao/gestao" passHref>
                  <Button variant="ghost" size="sm" aria-label="Gestão de Pós-Contemplação">
                    <BarChart2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Gestão de Pós-Contemplação</span>
                  </Button>
                </Link>
              )}
              {isTicketDashboardArea && canViewSettings && !isArchivedPage && !isGestaoPage && !isConfiguracoesPage && email !== 'aprendiz.gre@portovaleconsorcios.com.br' && (
                <Link href="/suporte-gre/configuracoes" passHref>
                  <Button variant="ghost" size="sm" aria-label="Configurações">
                    <Settings className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Configurações</span>
                  </Button>
                </Link>
              )}
              <Link href="/hub" passHref>
                  <Button variant="ghost" size="icon" aria-label="Portal Principal">
                    <Home className="h-5 w-5" />
                  </Button>
              </Link>
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
              style={{ height: 'auto', width: 'auto' }}
            />
        </Link>

        {!isLoading && isAuthenticated && (
          <div className="flex items-center gap-2">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-foreground -mb-1">{displayName}</p>
                    {displayCargo && <p className="text-xs text-muted-foreground capitalize">{displayCargo}</p>}
                  </div>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/atualizar-senha" passHref>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Redefinir Senha</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
