import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatFCFA } from "@/lib/utils";
import { ManouPro } from "@/components/shared/ManouPro";
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

  // 4 semaines glissantes pour le CA
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const end = new Date(startOfDay);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    return { label: `S-${i}`, start, end };
  }).reverse();

  const [
    todayBookings,
    monthBookings,
    pendingBookings,
    monthRevenue,
    totalRevenue,
    noShowCount,
    recentBookings,
    weeklyRevenues,
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
      where: { booking: { prestataireId: prestataire.id }, status: "SUCCESS", paidAt: { gte: startOfMonth } },
      _sum: { prestataireNet: true },
    }),
    prisma.payment.aggregate({
      where: { booking: { prestataireId: prestataire.id }, status: "SUCCESS" },
      _sum: { prestataireNet: true },
    }),
    prisma.booking.count({
      where: { prestataireId: prestataire.id, status: "NO_SHOW" },
    }),
    prisma.booking.findMany({
      where: { prestataireId: prestataire.id },
      take: 5,
      orderBy: { scheduledAt: "desc" },
      include: {
        user: { select: { name: true } },
        service: { select: { name: true, price: true } },
        payment: { select: { status: true } },
      },
    }),
    Promise.all(
      weeks.map((w) =>
        prisma.payment.aggregate({
          where: { booking: { prestataireId: prestataire.id }, status: "SUCCESS", paidAt: { gte: w.start, lt: w.end } },
          _sum: { prestataireNet: true },
        }).then((r) => ({ label: w.label, amount: r._sum.prestataireNet ?? 0 }))
      )
    ),
  ]);

  const sub = prestataire.subscription;
  const plan = sub?.plan ?? "FREE";
  const monthlyCount = sub?.monthlyCount ?? 0;
  const cap = plan === "GOLD" ? null : plan === "PRO" ? 100 : 10;
  const capPct = cap ? Math.min(100, Math.round((monthlyCount / cap) * 100)) : 100;

  const maxWeeklyRevenue = Math.max(...weeklyRevenues.map((w) => w.amount), 1);
  const noShowRate = prestataire._count.bookings > 0
    ? Math.round((noShowCount / prestataire._count.bookings) * 100)
    : 0;

  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING:   { label: "En attente", color: "bg-amber-100 text-amber-700" },
    CONFIRMED: { label: "Confirmé",   color: "bg-blue-100 text-blue-700" },
    COMPLETED: { label: "Terminé",    color: "bg-emerald-100 text-emerald-700" },
    CANCELLED: { label: "Annulé",     color: "bg-gray-100 text-gray-500" },
    NO_SHOW:   { label: "Absent",     color: "bg-red-100 text-red-600" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <Link href="/prestataire/agenda?tab=pending"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-medium hover:bg-amber-200 transition-colors">
            ⏰ {pendingBookings} en attente
          </Link>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Aujourd'hui" value={todayBookings} icon="📅" sub="réservations" />
        <StatCard label="Ce mois" value={monthBookings} icon="📊" sub="nouvelles résas" />
        <StatCard label="CA ce mois" value={formatFCFA(monthRevenue._sum.prestataireNet ?? 0)} icon="💰" sub="après commission" highlight />
        <StatCard label="Note" value={prestataire.rating > 0 ? `${prestataire.rating.toFixed(1)} ★` : "—"} icon="⭐" sub={`${prestataire._count.reviews} avis`} />
      </div>

      {/* CA + Stats grid */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* CA hebdomadaire */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-[var(--color-foreground)]">Chiffre d'affaires</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">4 dernières semaines</p>
            </div>
            <p className="text-sm font-semibold text-[var(--color-foreground)]">
              {formatFCFA(totalRevenue._sum.prestataireNet ?? 0)} total
            </p>
          </div>
          <div className="flex items-end gap-2 h-24">
            {weeklyRevenues.map((w, i) => {
              const pct = maxWeeklyRevenue > 0 ? Math.max(4, Math.round((w.amount / maxWeeklyRevenue) * 100)) : 4;
              const isLast = i === weeklyRevenues.length - 1;
              return (
                <div key={w.label} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs text-[var(--color-muted-foreground)] truncate w-full text-center">
                    {w.amount > 0 ? formatFCFA(w.amount).replace(" FCFA", "") : "—"}
                  </p>
                  <div className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${pct}%`,
                      background: isLast ? "var(--color-primary)" : "#e8d5e3",
                    }}
                  />
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {i === 3 ? "Cette sem." : i === 2 ? "Sem. -1" : i === 1 ? "Sem. -2" : "Sem. -3"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Métriques opérationnelles */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
          <p className="font-semibold text-[var(--color-foreground)] mb-4">Métriques clés</p>
          <div className="space-y-4">
            <Metric label="Taux no-show" value={`${noShowRate}%`}
              sub={noShowRate > 20 ? "⚠️ Élevé — activez les rappels" : "✓ Sous contrôle"}
              alert={noShowRate > 20} />
            <Metric label="Services actifs" value={`${prestataire._count.services}`}
              sub={prestataire._count.services < 3 ? "Ajoutez au moins 3 services avec photos" : "Catalogue complet"} />
            <Metric label="Réservations totales" value={`${prestataire._count.bookings}`}
              sub={`Plan ${plan} · ${monthlyCount}/${cap ?? "∞"} ce mois`} />
          </div>
          {plan !== "GOLD" && cap && capPct >= 70 && (
            <Link href="/prestataire/abonnement"
              className="mt-4 block text-center py-2 rounded-xl text-xs font-medium text-white jam-gradient hover:opacity-90">
              {capPct >= 90 ? "🚨 Limite atteinte — Upgrader" : "⚠️ Bientôt la limite — Upgrader"}
            </Link>
          )}
        </div>
      </div>

      {/* Réservations récentes */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)]">
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--color-foreground)]">Réservations récentes</h2>
          <Link href="/prestataire/agenda" className="text-xs text-[var(--color-primary)] hover:underline">Voir l'agenda →</Link>
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
                  <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{b.user.name ?? "Client"}</p>
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

      {/* Manou suggestions */}
      <ManouPro />

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/prestataire/services/nouveau", icon: "✂️", label: "Nouveau service", sub: "Ajoutez une prestation" },
          { href: "/prestataire/services", icon: "📝", label: "Mes services", sub: "Modifier prix, photos" },
          { href: "/prestataire/agenda?tab=pending", icon: "📋", label: "Gérer l'agenda", sub: "Confirmer les demandes" },
          { href: "/prestataire/abonnement", icon: "⭐", label: "Mon abonnement", sub: `Plan ${plan}` },
        ].map((a) => (
          <Link key={a.href} href={a.href}
            className="bg-white rounded-2xl border border-[var(--color-border)] p-4 hover:border-[var(--color-primary)]/40 hover:shadow-sm transition-all">
            <p className="text-xl mb-1">{a.icon}</p>
            <p className="font-semibold text-[var(--color-foreground)] text-sm">{a.label}</p>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{a.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, sub, highlight }: {
  label: string; value: string | number; icon: string; sub: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "jam-gradient text-white border-transparent" : "bg-white border-[var(--color-border)]"}`}>
      <p className="text-2xl mb-1">{icon}</p>
      <p className={`text-xl font-display font-semibold ${highlight ? "text-white" : "text-[var(--color-foreground)]"}`}>{value}</p>
      <p className={`text-sm font-medium mt-0.5 ${highlight ? "text-white" : "text-[var(--color-foreground)]"}`}>{label}</p>
      <p className={`text-xs mt-0.5 ${highlight ? "text-white/70" : "text-[var(--color-muted-foreground)]"}`}>{sub}</p>
    </div>
  );
}

function Metric({ label, value, sub, alert }: { label: string; value: string; sub: string; alert?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-[var(--color-foreground)]">{label}</p>
        <p className={`text-xs mt-0.5 ${alert ? "text-amber-600" : "text-[var(--color-muted-foreground)]"}`}>{sub}</p>
      </div>
      <p className={`text-lg font-bold ${alert ? "text-amber-600" : "text-[var(--color-foreground)]"}`}>{value}</p>
    </div>
  );
}
