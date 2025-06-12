
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import type { Ticket, TicketStatus, TicketFile } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface TicketContextType {
  tickets: Ticket[];
  addTicket: (ticketData: {
    name: string;
    phone: string;
    reason: string;
    estimatedResponseTime: string;
    observations?: string;
    file?: TicketFile;
  }) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  updateTicketResponsible: (ticketId: string, responsible: string) => void;
  getTicketById: (ticketId: string) => Ticket | undefined;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useLocalStorage<Ticket[]>('ticketflow-tickets', []);

  const addTicket = (ticketData: {
    name: string;
    phone: string;
    reason: string;
    estimatedResponseTime: string;
    observations?: string;
    file?: TicketFile;
  }) => {
    const newTicket: Ticket = {
      ...ticketData,
      id: crypto.randomUUID(),
      submissionDate: new Date().toISOString(),
      status: 'Novo',
    };
    setTickets(prevTickets => [...prevTickets, newTicket]);
  };

  const updateTicketStatus = (ticketId: string, status: TicketStatus) => {
    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, status } : ticket
      )
    );
  };

  const updateTicketResponsible = (ticketId: string, responsible: string) => {
    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, responsible } : ticket
      )
    );
  };
  
  const getTicketById = (ticketId: string): Ticket | undefined => {
    return tickets.find(ticket => ticket.id === ticketId);
  };

  return (
    <TicketContext.Provider value={{ tickets, addTicket, updateTicketStatus, updateTicketResponsible, getTicketById }}>
      {children}
    </TicketContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
}
