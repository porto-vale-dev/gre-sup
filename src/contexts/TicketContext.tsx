
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react'; // Added useState and useEffect
import type { Ticket, TicketStatus, TicketFile } from '@/types';
// import { useLocalStorage } from '@/hooks/useLocalStorage'; // Removed useLocalStorage

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
  const [tickets, setTickets] = useState<Ticket[]>([]); // Use useState instead of useLocalStorage

  // TODO: Implement API call to fetch initial tickets from the database when the component mounts
  // useEffect(() => {
  //   const fetchTickets = async () => {
  //     // const response = await fetch('/api/tickets');
  //     // const data = await response.json();
  //     // setTickets(data);
  //   };
  //   fetchTickets();
  // }, []);

  const addTicket = async (ticketData: { // Made async to simulate API call
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
    // TODO: Implement API call to save the new ticket to the database
    // await fetch('/api/tickets', { method: 'POST', body: JSON.stringify(newTicket) });
    setTickets(prevTickets => [...prevTickets, newTicket]);
  };

  const updateTicketStatus = async (ticketId: string, status: TicketStatus) => { // Made async
    // TODO: Implement API call to update ticket status in the database
    // await fetch(`/api/tickets/${ticketId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, status } : ticket
      )
    );
  };

  const updateTicketResponsible = async (ticketId: string, responsible: string) => { // Made async
    // TODO: Implement API call to update ticket responsible in the database
    // await fetch(`/api/tickets/${ticketId}/responsible`, { method: 'PUT', body: JSON.stringify({ responsible }) });
    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, responsible } : ticket
      )
    );
  };
  
  const getTicketById = (ticketId: string): Ticket | undefined => {
    // This can remain a local find if tickets are already fetched,
    // or could be an API call if not all tickets are loaded client-side.
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
