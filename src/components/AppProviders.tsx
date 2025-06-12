"use client";

import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { TicketProvider } from '@/contexts/TicketContext';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";


export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <AuthProvider>
        <TicketProvider>
          {children}
          <Toaster />
        </TicketProvider>
      </AuthProvider>
    </TooltipProvider>
  );
}
