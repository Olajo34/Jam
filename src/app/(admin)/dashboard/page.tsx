import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [users, prestataires, bookings, payments] = await Promise.all([
    prisma.user.count(),
    prisma.prestataire.count(),
    prisma.booking.count(),
    prisma.payment.aggregate({ _sum: { commission: true } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold mb-8">Tableau de bord</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Utilisateurs" value={users} icon="👥" />
        <StatCard label="Prestataires" value={prestataires} icon="💼" />
        <StatCard label="Réservations" value={bookings} icon="📅" />
        <StatCard label="Commissions" value={`${(payments._sum.commission ?? 0).toLocaleString()} FCFA`} icon="💰" />
      </div>
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
        <p className="text-sm text-[var(--color-muted-foreground)]">Graphiques et analytics à venir.</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-2xl font-display font-semibold text-[var(--color-foreground)]">{value}</p>
      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{label}</p>
    </div>
  );
}
