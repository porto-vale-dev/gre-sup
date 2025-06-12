import { DashboardClient } from "@/components/DashboardClient";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-6 text-primary">Painel de Tickets</h1>
      <DashboardClient />
    </div>
  );
}
