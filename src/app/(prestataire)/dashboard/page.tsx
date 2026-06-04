import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PrestataireDashboard() {
  const session = await auth();
  const prestataire = await prisma.prestataire.findUnique({
    where: { userId: session!.user.id },
    include: { subscription: true, _count: { select: { bookings: true, services: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold mb-8">
        Bonjour, {session?.user.name ?? "Prestataire"} 👋
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Réservations" value={prestataire?._count.bookings ?? 0} icon="📅" />
        <StatCard label="Services actifs" value={prestataire?._count.services ?? 0} icon="✂️" />
        <StatCard label="Plan" value={prestataire?.subscription?.plan ?? "FREE"} icon="⭐" />
        <StatCard label="Statut" value={prestataire?.enrollmentStatus ?? "—"} icon="✅" />
      </div>
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Activité récente et statistiques à venir.
        </p>
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
