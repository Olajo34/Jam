import { prisma } from "@/lib/prisma";
import { formatFCFA } from "@/lib/utils";
import { approveEnrollment, rejectEnrollment } from "@/lib/actions/enrollment";
import { auth } from "@/lib/auth";
import { ManouAdmin } from "@/components/shared/ManouAdmin";
import Link from "next/link";
import { type LucideIcon, Users, Briefcase, CalendarDays, Ticket, Banknote, CreditCard, Star, AlertTriangle, Users2, ClipboardList, TrendingUp, Settings } from "lucide-react";

export default async function AdminDashboard() {
  const session = await auth();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const [
    totalUsers,
    newUsersWeek,
    totalPrestataires,
    pendingEnrollments,
    totalBookings,
    monthlyBookings,
    payments,
    monthlyPayments,
    openTickets,
    failedPayments,
    goldCount,
    proCount,
    pendingList,
    openTicketsList,
    recentBookings,
    topPrestataires,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.prestataire.count({ where: { enrollmentStatus: "APPROVED" } }),
    prisma.prestataire.count({ where: { enrollmentStatus: { in: ["PENDING", "IN_REVIEW"] } } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.payment.aggregate({ _sum: { commission: true, amount: true } }),
    prisma.payment.aggregate({
      where: { status: "SUCCESS", createdAt: { gte: startOfMonth } },
      _sum: { commission: true, amount: true },
    }),
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
    prisma.subscription.count({ where: { plan: "GOLD", status: "ACTIVE" } }),
    prisma.subscription.count({ where: { plan: "PRO", status: "ACTIVE" } }),
    // Dossiers en attente (max 5)
    prisma.prestataire.findMany({
      where: { enrollmentStatus: { in: ["PENDING", "IN_REVIEW"] } },
      take: 5,
      orderBy: { createdAt: "asc" },
      include: { user: { select: { email: true } } },
    }),
    // Tickets ouverts (max 5)
    prisma.ticket.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    // Réservations récentes
    prisma.booking.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        prestataire: { select: { businessName: true } },
        service: { select: { name: true, price: true } },
        payment: { select: { status: true } },
      },
    }),
    // Top prestataires par réservations
    prisma.prestataire.findMany({
      where: { enrollmentStatus: "APPROVED" },
      take: 5,
      orderBy: { bookings: { _count: "desc" } },
      include: {
        _count: { select: { bookings: true } },
        subscription: { select: { plan: true } },
      },
    }),
  ]);

  const totalCommissions = payments._sum.commission ?? 0;
  const monthCommissions = monthlyPayments._sum.commission ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">
            Tableau de bord
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
            {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {" · "}Connecté en tant que <span className="font-medium">{session?.user.email?.split("@")[0]}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {pendingEnrollments > 0 && (
            <Link href="/moderateur/enrollments" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-medium hover:bg-amber-200 transition-colors">
              <AlertTriangle size={14} strokeWidth={2} />
              {pendingEnrollments} dossier{pendingEnrollments > 1 ? "s" : ""} en attente
            </Link>
          )}
          {openTickets > 0 && (
            <Link href="/moderateur/tickets" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-600 text-sm font-medium hover:bg-red-200 transition-colors">
              <Ticket size={14} strokeWidth={2} />
              {openTickets} ticket{openTickets > 1 ? "s" : ""} ouvert{openTickets > 1 ? "s" : ""}
            </Link>
          )}
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Clients inscrits" value={totalUsers.toLocaleString("fr-FR")} sub={`+${newUsersWeek} cette semaine`} Icon={Users} color="blue" />
        <KpiCard label="Prestataires actifs" value={totalPrestataires.toLocaleString("fr-FR")} sub={`${pendingEnrollments} en attente`} Icon={Briefcase} color="purple" alert={pendingEnrollments > 0} />
        <KpiCard label="Réservations (mois)" value={monthlyBookings.toLocaleString("fr-FR")} sub={`${totalBookings} au total`} Icon={CalendarDays} color="amber" />
        <KpiCard label="Tickets ouverts" value={openTickets.toString()} sub={failedPayments > 0 ? `${failedPayments} paiements échoués` : "Aucun problème"} Icon={Ticket} color="red" alert={openTickets > 0} />
      </div>

      {/* KPIs financiers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RevenueCard label="Commissions ce mois" value={formatFCFA(monthCommissions)} sub="revenus plateforme" Icon={Banknote} highlight />
        <RevenueCard label="Volume transactionnel" value={formatFCFA(monthlyPayments._sum.amount ?? 0)} sub="paiements réussis ce mois" Icon={CreditCard} />
        <RevenueCard label="Abonnements actifs" value={`${goldCount + proCount}`} sub={`${goldCount} Gold · ${proCount} Pro`} Icon={Star} />
      </div>

      {/* Zone de gestion principale */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Dossiers prestataires à traiter */}
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)]">
          <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-[var(--color-foreground)]">Dossiers prestataires</h2>
              {pendingEnrollments > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-white text-xs font-bold flex items-center justify-center">
                  {pendingEnrollments}
                </span>
              )}
            </div>
            <Link href="/moderateur/enrollments" className="text-xs text-[var(--color-primary)] hover:underline">Tous voir →</Link>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {pendingList.length === 0 ? (
              <p className="px-6 py-8 text-sm text-center text-[var(--color-muted-foreground)]">✓ Aucun dossier en attente</p>
            ) : pendingList.map((p) => (
              <div key={p.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{p.businessName}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)] truncate">{p.user.email} · {p.city ?? "—"}</p>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${p.enrollmentStatus === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                    {p.enrollmentStatus === "PENDING" ? "En attente" : "En examen"}
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={approveEnrollment.bind(null, p.id)}>
                    <button type="submit" className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700">
                      ✓ Approuver
                    </button>
                  </form>
                  <form action={async (fd: FormData) => {
                    "use server";
                    await rejectEnrollment(p.id, fd.get("reason") as string ?? "");
                  }}>
                    <button type="submit" className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50">
                      ✕
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tickets support */}
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)]">
          <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-[var(--color-foreground)]">Tickets support</h2>
              {openTickets > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-400 text-white text-xs font-bold flex items-center justify-center">
                  {openTickets}
                </span>
              )}
            </div>
            <Link href="/moderateur/tickets" className="text-xs text-[var(--color-primary)] hover:underline">Tous voir →</Link>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {openTicketsList.length === 0 ? (
              <p className="px-6 py-8 text-sm text-center text-[var(--color-muted-foreground)]">✓ Aucun ticket ouvert</p>
            ) : openTicketsList.map((t) => (
              <Link key={t.id} href={`/moderateur/tickets/${t.id}`} className="block px-5 py-3.5 hover:bg-[var(--color-background)] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{t.subject}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)] truncate">{t.user.name ?? t.user.email}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${t.status === "OPEN" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {t.status === "OPEN" ? "Ouvert" : "En cours"}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                  {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Réservations récentes + Top prestataires */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Réservations récentes */}
        <div className="lg:col-span-2 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)]">
          <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-foreground)]">Réservations récentes</h2>
            <Link href="/admin/finances" className="text-xs text-[var(--color-primary)] hover:underline">Finances →</Link>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {recentBookings.length === 0 && (
              <p className="px-6 py-8 text-sm text-center text-[var(--color-muted-foreground)]">Aucune réservation</p>
            )}
            {recentBookings.map((b) => (
              <div key={b.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                    {b.user.name ?? "Client"} → {b.prestataire.businessName}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)] truncate">{b.service.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">{formatFCFA(b.service.price)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    b.payment?.status === "SUCCESS" ? "bg-emerald-100 text-emerald-700" :
                    b.payment?.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {b.payment?.status === "SUCCESS" ? "Payé" : b.payment?.status === "PENDING" ? "En attente" : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top prestataires */}
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)]">
          <div className="px-6 py-4 border-b border-[var(--color-border)]">
            <h2 className="font-semibold text-[var(--color-foreground)]">Top prestataires</h2>
            <p className="text-xs text-[var(--color-muted-foreground)]">Par nombre de réservations</p>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {topPrestataires.map((p, i) => (
              <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--color-background)] text-xs font-bold text-[var(--color-muted-foreground)] flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{p.businessName}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{p._count.bookings} réservations</p>
                </div>
                {p.subscription?.plan && p.subscription.plan !== "FREE" && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${p.subscription.plan === "GOLD" ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"}`}>
                    {p.subscription.plan}
                  </span>
                )}
              </div>
            ))}
            {topPrestataires.length === 0 && (
              <p className="px-5 py-8 text-sm text-center text-[var(--color-muted-foreground)]">Aucun prestataire</p>
            )}
          </div>
        </div>
      </div>

      {/* Manou — Expert Comptabilité & Marketing */}
      <ManouAdmin />

      {/* Accès rapides */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-4">Accès rapides</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/admin/utilisateurs", Icon: Users2, label: "Gérer les comptes", sub: `${totalUsers} clients` },
            { href: "/moderateur/enrollments", Icon: ClipboardList, label: "Dossiers prestataires", sub: `${pendingEnrollments} en attente` },
            { href: "/admin/finances", Icon: TrendingUp, label: "Finances", sub: formatFCFA(totalCommissions) + " commissions" },
            { href: "/admin/parametres", Icon: Settings, label: "Paramètres", sub: "Commission, plans" },
          ].map(({ href, Icon: Icon2, label, sub }) => (
            <Link key={href} href={href}
              className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4 hover:border-[var(--color-primary)]/40 hover:shadow-md transition-all cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-cream)] flex items-center justify-center mb-3">
                <Icon2 size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
              </div>
              <p className="font-semibold text-[var(--color-foreground)] text-sm">{label}</p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{sub}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, Icon, color, alert }: {
  label: string; value: string; sub: string; Icon: LucideIcon;
  color: "blue" | "purple" | "amber" | "red"; alert?: boolean;
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className={`bg-[var(--color-card)] rounded-2xl border p-5 ${alert ? "border-amber-300" : "border-[var(--color-border)]"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <p className="text-2xl font-display font-semibold text-[var(--color-foreground)]">{value}</p>
      <p className="text-sm font-medium text-[var(--color-foreground)] mt-0.5">{label}</p>
      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{sub}</p>
    </div>
  );
}

function RevenueCard({ label, value, sub, Icon, highlight }: {
  label: string; value: string; sub: string; Icon: LucideIcon; highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "jam-gradient border-transparent" : "bg-[var(--color-card)] border-[var(--color-border)]"}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${highlight ? "bg-white/20" : "bg-[var(--color-cream)]"}`}>
        <Icon size={17} strokeWidth={1.5} className={highlight ? "text-white" : "text-[var(--color-primary)]"} />
      </div>
      <p className={`text-2xl font-display font-semibold ${highlight ? "text-white" : "text-[var(--color-foreground)]"}`}>{value}</p>
      <p className={`text-sm font-medium mt-0.5 ${highlight ? "text-white" : "text-[var(--color-foreground)]"}`}>{label}</p>
      <p className={`text-xs mt-0.5 ${highlight ? "text-white/70" : "text-[var(--color-muted-foreground)]"}`}>{sub}</p>
    </div>
  );
}
