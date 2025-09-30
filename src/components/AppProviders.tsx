
"use client";

import React, { useState, type FC, type ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { TicketProvider } from '@/contexts/TicketContext';
import { CobrancaTicketProvider } from '@/contexts/CobrancaTicketContext';
import { PosContemplacaoTicketProvider } from '@/contexts/PosContemplacaoTicketContext';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TicketDetailsModal } from './TicketDetailsModal';
import { CobrancaTicketDetailsModal } from './CobrancaTicketDetailsModal';
import { PosContemplacaoTicketDetailsModal } from './PosContemplacaoTicketDetailsModal';
import type { Ticket, CobrancaTicket, PosContemplacaoTicket } from '@/types';

type ModalState = {
  ticket: Ticket | null;
  cobrancaTicket: CobrancaTicket | null;
  posContemplacaoTicket: PosContemplacaoTicket | null;
};

// We create a new context to handle the modals globally
export const ModalContext = React.createContext<{
  openModal: (ticket: Ticket | CobrancaTicket | PosContemplacaoTicket) => void;
}>({
  openModal: () => {},
});


// New component to wrap the providers and manage modal state
const GlobalModalManager: FC<{ children: ReactNode }> = ({ children }) => {
    const [modalState, setModalState] = useState<ModalState>({
        ticket: null,
        cobrancaTicket: null,
        posContemplacaoTicket: null,
    });

    const openModal = (ticket: Ticket | CobrancaTicket | PosContemplacaoTicket) => {
        if ('reason' in ticket) { // This is a regular Ticket
             setModalState({ ticket: ticket, cobrancaTicket: null, posContemplacaoTicket: null });
        } else if ('diretor' in ticket) { // This is a CobrancaTicket
             setModalState({ ticket: null, cobrancaTicket: ticket, posContemplacaoTicket: null });
        } else { // This is a PosContemplacaoTicket
             setModalState({ ticket: null, cobrancaTicket: null, posContemplacaoTicket: ticket });
        }
    };

    const closeModal = () => {
        setModalState({ ticket: null, cobrancaTicket: null, posContemplacaoTicket: null });
    };

    return (
        <ModalContext.Provider value={{ openModal }}>
            {children}
            {modalState.ticket && (
                <TicketDetailsModal
                    ticket={modalState.ticket}
                    isOpen={!!modalState.ticket}
                    onClose={closeModal}
                />
            )}
            {modalState.cobrancaTicket && (
                <CobrancaTicketDetailsModal
                    ticket={modalState.cobrancaTicket}
                    isOpen={!!modalState.cobrancaTicket}
                    onClose={closeModal}
                />
            )}
            {modalState.posContemplacaoTicket && (
                <PosContemplacaoTicketDetailsModal
                    ticket={modalState.posContemplacaoTicket}
                    isOpen={!!modalState.posContemplacaoTicket}
                    onClose={closeModal}
                />
            )}
        </ModalContext.Provider>
    );
};


export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <AuthProvider>
        <TicketProvider>
          <CobrancaTicketProvider>
            <PosContemplacaoTicketProvider>
              <GlobalModalManager>
                {children}
                <Toaster />
              </GlobalModalManager>
            </PosContemplacaoTicketProvider>
          </CobrancaTicketProvider>
        </TicketProvider>
      </AuthProvider>
    </TooltipProvider>
  );
}
