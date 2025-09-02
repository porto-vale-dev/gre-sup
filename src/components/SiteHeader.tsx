
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Home, LayoutDashboard, Settings, UserCircle } from 'lucide-react';
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


// Import local images
import logoTicket from './logo_ticket_pv.webp';
import logoPortal from './logo_portal_pv.webp';

export function SiteHeader() {
  const pathname = usePathname();
  const { isAuthenticated, logout, isLoading, user, username, cargo } = useAuth();
  
  const handleLogout = () => {
    logout();
  };

  const capitalizeFirstLetter = (string: string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const displayName = capitalizeFirstLetter(username || user?.email?.split('@')[0] || '');
  const avatarFallback = displayName ? displayName.charAt(0) : <UserCircle className="h-6 w-6" />;


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
  const isTicketSystemArea = pathname.startsWith('/suporte-gre') || pathname.startsWith('/dashboard');

  if (isTicketSystemArea) {
    const isTicketDashboardArea = pathname.startsWith('/suporte-gre/painel') || pathname.startsWith('/dashboard');
    const isArchivedPage = pathname === '/suporte-gre/painel/archived' || pathname === '/dashboard/archived';
    const isGestaoPage = pathname === '/suporte-gre/gestao';
    const isConfiguracoesPage = pathname === '/suporte-gre/configuracoes';
    const allowedManagementRoles = ['adm', 'greadmin', 'gre'];
    const canViewManagement = cargo && allowedManagementRoles.includes(cargo);
    const canViewSettings = cargo === 'adm' || cargo === 'greadmin';


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
              width={149}
              height={45}
              priority
              style={{ height: 'auto' }}
            />
          </Link>

          {!isLoading && isAuthenticated && (
            <nav className="flex items-center gap-1 sm:gap-2">
              {(isGestaoPage || isConfiguracoesPage || isArchivedPage) && (
                <Link href="/suporte-gre/painel" passHref>
                  <Button variant="ghost" size="sm" aria-label="Painel Principal">
                    <TicketIcon className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Painel</span>
                  </Button>
                </Link>
              )}
              {isTicketDashboardArea && canViewManagement && !isArchivedPage && (
                <Link href="/suporte-gre/gestao" passHref>
                  <Button variant="ghost" size="sm" aria-label="Gestão de Suporte">
                    <LayoutDashboard className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Gestão</span>
                  </Button>
                </Link>
              )}
              {isTicketDashboardArea && canViewSettings && !isArchivedPage && (
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground -mb-1">{displayName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{cargo}</p>
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
        )}
      </div>
    </header>
  );
}
