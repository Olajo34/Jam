import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { approveEnrollment, rejectEnrollment } from "@/lib/actions/enrollment";
import Link from "next/link";

export default async function ModerateurDashboard() {
  const session = await auth();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const [
    openTickets,
    inProgressTickets,
    resolvedToday,
    pendingEnrollments,
    inReviewEnrollments,
    approvedThisWeek,
    recentTickets,
    pendingList,
  ] = await Promise.all([
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
    prisma.ticket.count({ where: { status: { in: ["RESOLVED", "CLOSED"] }, updatedAt: { gte: startOfDay } } }),
    prisma.prestataire.count({ where: { enrollmentStatus: "PENDING" } }),
    prisma.prestataire.count({ where: { enrollmentStatus: "IN_REVIEW" } }),
    prisma.prestataire.count({ where: { enrollmentStatus: "APPROVED", updatedAt: { gte: startOfWeek } } }),
    prisma.ticket.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.prestataire.findMany({
      where: { enrollmentStatus: { in: ["PENDING", "IN_REVIEW"] } },
      take: 5,
      orderBy: { createdAt: "asc" },
      include: { user: { select: { email: true } } },
    }),
  ]);

  const totalPending = openTickets + inProgressTickets;

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
            {" · "}
            <span className="font-medium">{session?.user.email?.split("@")[0]}</span>
          </p>
        </div>
        {totalPending > 0 && (
          <div className="flex gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-medium">
              🎫 {totalPending} ticket{totalPending > 1 ? "s" : ""} actif{totalPending > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tickets ouverts"
          value={openTickets}
          icon="🔴"
          sub="À traiter en priorité"
          alert={openTickets > 0}
          href="/moderateur/tickets?status=OPEN"
        />
        <StatCard
          label="En cours"
          value={inProgressTickets}
          icon="🟡"
          sub="Tickets pris en charge"
          href="/moderateur/tickets?status=IN_PROGRESS"
        />
        <StatCard
          label="Résolus aujourd'hui"
          value={resolvedToday}
          icon="✅"
          sub="Tickets clôturés"
        />
        <StatCard
          label="Dossiers en attente"
          value={pendingEnrollments + inReviewEnrollments}
          icon="📋"
          sub={`${pendingEnrollments} en attente · ${inReviewEnrollments} en examen`}
          alert={pendingEnrollments > 0}
          href="/moderateur/enrollments"
        />
      </div>

      {/* Stat prestataires */}
      {approvedThisWeek > 0 && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
          <span className="text-2xl">🎉</span>
          <p className="text-sm text-emerald-800">
            <strong>{approvedThisWeek} prestataire{approvedThisWeek > 1 ? "s" : ""}</strong> approuvé{approvedThisWeek > 1 ? "s" : ""} cette semaine.
          </p>
        </div>
      )}

      {/* Zone principale */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Tickets actifs */}
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)]">
          <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-[var(--color-foreground)]">Tickets actifs</h2>
              {totalPending > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-400 text-white text-xs font-bold flex items-center justify-center">
                  {totalPending}
                </span>
              )}
            </div>
            <Link href="/moderateur/tickets" className="text-xs text-[var(--color-primary)] hover:underline">
              Tous voir →
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {recentTickets.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">Aucun ticket actif — beau travail !</p>
              </div>
            ) : recentTickets.map((t) => (
              <Link
                key={t.id}
                href={`/moderateur/tickets/${t.id}`}
                className="block px-5 py-3.5 hover:bg-[var(--color-background)] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{t.subject}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                      {t.user.name ?? t.user.email}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                    t.status === "OPEN" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {t.status === "OPEN" ? "Ouvert" : "En cours"}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                  {new Date(t.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Dossiers prestataires */}
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
            <Link href="/moderateur/enrollments" className="text-xs text-[var(--color-primary)] hover:underline">
              Tous voir →
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {pendingList.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-3xl mb-2">✓</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">Aucun dossier en attente</p>
              </div>
            ) : pendingList.map((p) => (
              <div key={p.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{p.businessName}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                    {p.user.email} · {p.city ?? "—"}
                  </p>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.enrollmentStatus === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {p.enrollmentStatus === "PENDING" ? "En attente" : "En examen"}
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={approveEnrollment.bind(null, p.id)}>
                    <button type="submit" className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors">
                      ✓
                    </button>
                  </form>
                  <form action={async (fd: FormData) => {
                    "use server";
                    await rejectEnrollment(p.id, fd.get("reason") as string ?? "");
                  }}>
                    <button type="submit" className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors">
                      ✕
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Accès rapides */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-4">
          Accès rapides
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/moderateur/tickets"
            className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4 hover:border-[var(--color-primary)]/40 hover:shadow-md transition-all"
          >
            <p className="text-2xl mb-2">🎫</p>
            <p className="font-semibold text-[var(--color-foreground)] text-sm">Tickets clients</p>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
              {totalPending} actif{totalPending > 1 ? "s" : ""}
            </p>
          </Link>
          <Link
            href="/moderateur/enrollments"
            className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4 hover:border-[var(--color-primary)]/40 hover:shadow-md transition-all"
          >
            <p className="text-2xl mb-2">📋</p>
            <p className="font-semibold text-[var(--color-foreground)] text-sm">Dossiers prestataires</p>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
              {pendingEnrollments + inReviewEnrollments} à traiter
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon, sub, alert, href,
}: {
  label: string; value: number; icon: string; sub: string; alert?: boolean; href?: string;
}) {
  const inner = (
    <div className={`bg-[var(--color-card)] rounded-2xl border p-5 transition-all ${
      alert ? "border-amber-300" : "border-[var(--color-border)]"
    } ${href ? "hover:shadow-md hover:border-[var(--color-primary)]/40" : ""}`}>
      <p className="text-2xl mb-3">{icon}</p>
      <p className="text-2xl font-display font-semibold text-[var(--color-foreground)]">
        {value.toLocaleString("fr-FR")}
      </p>
      <p className="text-sm font-medium text-[var(--color-foreground)] mt-0.5">{label}</p>
      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{sub}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
