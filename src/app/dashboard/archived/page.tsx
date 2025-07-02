
import { ArchivedTicketsClient } from "@/components/ArchivedTicketsClient";

export const dynamic = 'force-dynamic';

export default function ArchivedTicketsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-6 text-primary">Tickets Arquivados</h1>
      <ArchivedTicketsClient />
    </div>
  );
}
