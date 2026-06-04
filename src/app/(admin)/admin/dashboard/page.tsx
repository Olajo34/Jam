import { prisma } from "@/lib/prisma";
import { formatFCFA } from "@/lib/utils";

export default async function AdminDashboard() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalPrestataires,
    pendingEnrollments,
    totalBookings,
    monthlyBookings,
    payments,
    monthlyPayments,
    openTickets,
    goldCount,
    proCount,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.prestataire.count({ where: { enrollmentStatus: "APPROVED" } }),
    prisma.prestataire.count({ where: { enrollmentStatus: { in: ["PENDING", "IN_REVIEW"] } } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.payment.aggregate({ _sum: { commission: true, amount: true } }),
    prisma.payment.aggregate({
      where: { createdAt: { gte: startOfMonth }, status: "SUCCESS" },
      _sum: { commission: true, amount: true },
    }),
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.subscription.count({ where: { plan: "GOLD", status: "ACTIVE" } }),
    prisma.subscription.count({ where: { plan: "PRO", status: "ACTIVE" } }),
  ]);

  const recentBookings = await prisma.booking.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      prestataire: { select: { businessName: true } },
      service: { select: { name: true, price: true } },
      payment: { select: { status: true, amount: true } },
    },
  });

  const recentPrestataires = await prisma.prestataire.findMany({
    where: { enrollmentStatus: { in: ["PENDING", "IN_REVIEW"] } },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Tableau de bord</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Utilisateurs" value={totalUsers} sub="inscrits" icon="👥" color="blue" />
        <KpiCard label="Prestataires actifs" value={totalPrestataires} sub={`${pendingEnrollments} en attente`} icon="💼" color="purple" alert={pendingEnrollments > 0} />
        <KpiCard label="Réservations" value={monthlyBookings} sub={`${totalBookings} au total`} icon="📅" color="amber" />
        <KpiCard label="Tickets ouverts" value={openTickets} sub="à traiter" icon="🎫" color="red" alert={openTickets > 0} />
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RevenueCard
          label="Volume ce mois"
          value={formatFCFA(monthlyPayments._sum.amount ?? 0)}
          sub="transactions réussies"
          icon="💳"
        />
        <RevenueCard
          label="Commissions ce mois"
          value={formatFCFA(monthlyPayments._sum.commission ?? 0)}
          sub="revenus plateforme"
          icon="💰"
          highlight
        />
        <RevenueCard
          label="Abonnements actifs"
          value={`${goldCount + proCount}`}
          sub={`${goldCount} Gold · ${proCount} Pro`}
          icon="⭐"
        />
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent bookings */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)]">
          <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-foreground)]">Réservations récentes</h2>
            <a href="/admin/finances" className="text-xs text-[var(--color-primary)] hover:underline">Voir tout</a>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {recentBookings.length === 0 && (
              <p className="px-6 py-8 text-sm text-center text-[var(--color-muted-foreground)]">Aucune réservation</p>
            )}
            {recentBookings.map((b) => (
              <div key={b.id} className="px-6 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                    {b.user.name ?? b.user.email}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                    {b.prestataire.businessName} · {b.service.name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">{formatFCFA(b.service.price)}</p>
                  <PaymentBadge status={b.payment?.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending enrollments */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)]">
          <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-foreground)]">
              Dossiers en attente
              {pendingEnrollments > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                  {pendingEnrollments}
                </span>
              )}
            </h2>
            <a href="/moderateur/enrollments" className="text-xs text-[var(--color-primary)] hover:underline">Traiter</a>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {recentPrestataires.length === 0 && (
              <p className="px-6 py-8 text-sm text-center text-[var(--color-muted-foreground)]">Aucun dossier en attente</p>
            )}
            {recentPrestataires.map((p) => (
              <div key={p.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-foreground)]">{p.businessName}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{p.user.email}</p>
                </div>
                <StatusBadge status={p.enrollmentStatus} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label, value, sub, icon, color, alert,
}: {
  label: string; value: number; sub: string; icon: string;
  color: "blue" | "purple" | "amber" | "red"; alert?: boolean;
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className={`bg-white rounded-2xl border p-5 ${alert ? "border-amber-300" : "border-[var(--color-border)]"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-display font-semibold text-[var(--color-foreground)]">
        {value.toLocaleString("fr-FR")}
      </p>
      <p className="text-sm font-medium text-[var(--color-foreground)] mt-0.5">{label}</p>
      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{sub}</p>
    </div>
  );
}

function RevenueCard({
  label, value, sub, icon, highlight,
}: {
  label: string; value: string; sub: string; icon: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "bg-[var(--color-primary)] border-transparent text-white" : "bg-white border-[var(--color-border)]"}`}>
      <p className={`text-2xl mb-1 ${highlight ? "" : ""}`}>{icon}</p>
      <p className={`text-2xl font-display font-semibold ${highlight ? "text-white" : "text-[var(--color-foreground)]"}`}>
        {value}
      </p>
      <p className={`text-sm font-medium mt-0.5 ${highlight ? "text-white" : "text-[var(--color-foreground)]"}`}>{label}</p>
      <p className={`text-xs mt-0.5 ${highlight ? "text-white/70" : "text-[var(--color-muted-foreground)]"}`}>{sub}</p>
    </div>
  );
}

function PaymentBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-xs text-[var(--color-muted-foreground)]">—</span>;
  const map: Record<string, string> = {
    SUCCESS: "text-emerald-600 bg-emerald-50",
    PENDING: "text-amber-600 bg-amber-50",
    FAILED: "text-red-600 bg-red-50",
  };
  const labels: Record<string, string> = { SUCCESS: "Payé", PENDING: "En attente", FAILED: "Échoué" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {labels[status] ?? status}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    IN_REVIEW: "bg-blue-100 text-blue-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    PENDING: "En attente", IN_REVIEW: "En examen", APPROVED: "Approuvé", REJECTED: "Rejeté",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {labels[status] ?? status}
    </span>
  );
}
