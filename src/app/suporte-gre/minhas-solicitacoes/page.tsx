
'use client';

import { MyTicketsClient } from "@/components/MyTicketsClient";

export default function MinhasSolicitacoesPage() {
  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold font-headline text-primary">Minhas Solicitações</h1>
      <MyTicketsClient />
    </div>
  );
}
