import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatFCFA } from "@/lib/utils";
import Link from "next/link";

export default async function PrestataireDashboard() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const prestataire = await prisma.prestataire.findUnique({
    where: { userId: session.user.id },
    include: {
      subscription: true,
      _count: { select: { bookings: true, services: true, reviews: true } },
    },
  });

  if (!prestataire) redirect("/prestataire/onboarding");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);

  const [
    todayBookings,
    monthBookings,
    pendingBookings,
    monthRevenue,
    recentBookings,
  ] = await Promise.all([
    prisma.booking.count({
      where: { prestataireId: prestataire.id, scheduledAt: { gte: startOfDay, lt: endOfDay } },
    }),
    prisma.booking.count({
      where: { prestataireId: prestataire.id, createdAt: { gte: startOfMonth } },
    }),
    prisma.booking.count({
      where: { prestataireId: prestataire.id, status: "PENDING" },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { prestataireId: prestataire.id },
        status: "SUCCESS",
        paidAt: { gte: startOfMonth },
      },
      _sum: { prestataireNet: true },
    }),
    prisma.booking.findMany({
      where: { prestataireId: prestataire.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, phone: true } },
        service: { select: { name: true, price: true } },
        payment: { select: { status: true } },
      },
    }),
  ]);

  const sub = prestataire.subscription;
  const plan = sub?.plan ?? "FREE";
  const monthlyCount = sub?.monthlyCount ?? 0;
  const cap = plan === "GOLD" ? null : plan === "PRO" ? 100 : 10;
  const capPct = cap ? Math.min(100, Math.round((monthlyCount / cap) * 100)) : 100;

  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING:   { label: "En attente", color: "bg-amber-100 text-amber-700" },
    CONFIRMED: { label: "Confirmé",   color: "bg-blue-100 text-blue-700" },
    COMPLETED: { label: "Terminé",    color: "bg-emerald-100 text-emerald-700" },
    CANCELLED: { label: "Annulé",     color: "bg-gray-100 text-gray-500" },
    NO_SHOW:   { label: "Absent",     color: "bg-red-100 text-red-600" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">
            Bonjour, {session.user.name ?? "Prestataire"} 👋
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
            {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        {pendingBookings > 0 && (
          <Link
            href="/prestataire/agenda?tab=pending"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-medium hover:bg-amber-200 transition-colors"
          >
            ⏰ {pendingBookings} en attente
          </Link>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Aujourd'hui" value={todayBookings} icon="📅" sub="réservations" />
        <StatCard label="Ce mois" value={monthBookings} icon="📊" sub="nouvelles résas" />
        <StatCard
          label="Revenus (mois)"
          value={formatFCFA(monthRevenue._sum.prestataireNet ?? 0)}
          icon="💰"
          sub="après commission"
          highlight
        />
        <StatCard label="Note" value={prestataire.rating > 0 ? `${prestataire.rating.toFixed(1)} ★` : "—"} icon="⭐" sub={`${prestataire._count.reviews} avis`} />
      </div>

      {/* Subscription cap */}
      {plan !== "GOLD" && cap && (
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-[var(--color-foreground)]">Plan {plan}</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {monthlyCount} / {cap} réservations ce mois
              </p>
            </div>
            <Link
              href="/prestataire/abonnement"
              className="px-4 py-1.5 rounded-full text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-cream)] transition-colors"
            >
              {capPct >= 80 ? "⚠️ Mettre à niveau" : "Gérer"}
            </Link>
          </div>
          <div className="h-2 rounded-full bg-[var(--color-muted)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${capPct >= 90 ? "bg-red-500" : capPct >= 70 ? "bg-amber-500" : "jam-gradient"}`}
              style={{ width: `${capPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)]">
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--color-foreground)]">Réservations récentes</h2>
          <Link href="/prestataire/agenda" className="text-xs text-[var(--color-primary)] hover:underline">
            Voir l'agenda →
          </Link>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {recentBookings.length === 0 && (
            <div className="px-6 py-10 text-center">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">Aucune réservation pour l'instant.</p>
            </div>
          )}
          {recentBookings.map((b) => {
            const cfg = STATUS_CONFIG[b.status];
            return (
              <div key={b.id} className="px-6 py-3.5 flex items-center gap-4">
                <div className="text-center w-12 shrink-0">
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {new Date(b.scheduledAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  </p>
                  <p className="text-sm font-bold text-[var(--color-foreground)]">
                    {new Date(b.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                    {b.user.name ?? "Client"}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)] truncate">{b.service.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">{formatFCFA(b.service.price)}</p>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg?.color}`}>
                    {cfg?.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/prestataire/services/nouveau"
          className="bg-white rounded-2xl border border-[var(--color-border)] p-5 hover:border-[var(--color-primary)]/40 hover:shadow-sm transition-all"
        >
          <p className="text-2xl mb-1.5">✂️</p>
          <p className="font-semibold text-[var(--color-foreground)] text-sm">Nouveau service</p>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">Ajoutez une prestation</p>
        </Link>
        <Link
          href="/prestataire/agenda?tab=pending"
          className="bg-white rounded-2xl border border-[var(--color-border)] p-5 hover:border-[var(--color-primary)]/40 hover:shadow-sm transition-all"
        >
          <p className="text-2xl mb-1.5">📋</p>
          <p className="font-semibold text-[var(--color-foreground)] text-sm">Gérer l'agenda</p>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">Confirmez les demandes</p>
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon, sub, highlight,
}: {
  label: string; value: string | number; icon: string; sub: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "jam-gradient text-white border-transparent" : "bg-white border-[var(--color-border)]"}`}>
      <p className="text-2xl mb-1">{icon}</p>
      <p className={`text-xl font-display font-semibold ${highlight ? "text-white" : "text-[var(--color-foreground)]"}`}>
        {value}
      </p>
      <p className={`text-sm font-medium mt-0.5 ${highlight ? "text-white" : "text-[var(--color-foreground)]"}`}>{label}</p>
      <p className={`text-xs mt-0.5 ${highlight ? "text-white/70" : "text-[var(--color-muted-foreground)]"}`}>{sub}</p>
    </div>
  );
}
