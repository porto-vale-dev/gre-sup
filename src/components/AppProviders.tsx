
"use client";

import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { TicketProvider } from '@/contexts/TicketContext';
import { CobrancaTicketProvider } from '@/contexts/CobrancaTicketContext';
import { PosContemplacaoTicketProvider } from '@/contexts/PosContemplacaoTicketContext';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";


export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <AuthProvider>
        <TicketProvider>
          <CobrancaTicketProvider>
            <PosContemplacaoTicketProvider>
              {children}
              <Toaster />
            </PosContemplacaoTicketProvider>
          </CobrancaTicketProvider>
        </TicketProvider>
      </AuthProvider>
    </TooltipProvider>
  );
}
