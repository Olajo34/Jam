import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { updateBookingStatus } from "@/lib/actions/prestataire";
import { formatFCFA } from "@/lib/utils";

const STATUS_CONFIG = {
  PENDING:   { label: "En attente",  color: "bg-amber-100 text-amber-700",   dot: "bg-amber-400" },
  CONFIRMED: { label: "Confirmé",    color: "bg-blue-100 text-blue-700",     dot: "bg-blue-400" },
  COMPLETED: { label: "Terminé",     color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
  CANCELLED: { label: "Annulé",      color: "bg-gray-100 text-gray-500",     dot: "bg-gray-300" },
  NO_SHOW:   { label: "Absent",      color: "bg-red-100 text-red-600",       dot: "bg-red-400" },
};

const TABS = [
  { key: "",           label: "Aujourd'hui" },
  { key: "upcoming",  label: "À venir" },
  { key: "past",      label: "Passées" },
  { key: "pending",   label: "En attente" },
];

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const session = await auth();
  if (!session) redirect("/connexion");

  const prestataire = await prisma.prestataire.findUnique({ where: { userId: session.user.id } });
  if (!prestataire) redirect("/prestataire/onboarding");

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);

  const whereMap: Record<string, object> = {
    "":         { scheduledAt: { gte: startOfDay, lt: endOfDay } },
    upcoming:   { scheduledAt: { gte: endOfDay }, status: { in: ["PENDING", "CONFIRMED"] } },
    past:       { scheduledAt: { lt: startOfDay } },
    pending:    { status: "PENDING" },
  };

  const bookings = await prisma.booking.findMany({
    where: { prestataireId: prestataire.id, ...whereMap[tab ?? ""] },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      service: { select: { name: true, duration: true, price: true } },
      payment: { select: { status: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  // counts for tab badges
  const [todayCount, pendingCount] = await Promise.all([
    prisma.booking.count({ where: { prestataireId: prestataire.id, ...whereMap[""] } }),
    prisma.booking.count({ where: { prestataireId: prestataire.id, status: "PENDING" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Agenda</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
          {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => {
          const badge = t.key === "" ? todayCount : t.key === "pending" ? pendingCount : 0;
          return (
            <a
              key={t.key}
              href={t.key ? `/prestataire/agenda?tab=${t.key}` : "/prestataire/agenda"}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                (tab ?? "") === t.key
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-cream)]"
              }`}
            >
              {t.label}
              {badge > 0 && (
                <span className={`ml-1.5 text-xs font-bold ${(tab ?? "") === t.key ? "opacity-80" : "text-[var(--color-primary)]"}`}>
                  {badge}
                </span>
              )}
            </a>
          );
        })}
      </div>

      {/* Bookings */}
      <div className="space-y-3">
        {bookings.length === 0 && (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-12 text-center text-[var(--color-muted-foreground)]">
            Aucune réservation dans cette période
          </div>
        )}
        {bookings.map((b) => {
          const cfg = STATUS_CONFIG[b.status as keyof typeof STATUS_CONFIG];
          const scheduledDate = new Date(b.scheduledAt);
          return (
            <div key={b.id} className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
              <div className="flex items-start justify-between gap-4">
                {/* Time + client */}
                <div className="flex items-start gap-4">
                  <div className="text-center bg-[var(--color-cream)] rounded-xl px-3 py-2 shrink-0">
                    <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
                      {scheduledDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    </p>
                    <p className="text-lg font-bold text-[var(--color-foreground)]">
                      {scheduledDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--color-foreground)]">
                      {b.user.name ?? b.user.email}
                    </p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {b.service.name} · {b.service.duration} min
                    </p>
                    {b.user.phone && (
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">📱 {b.user.phone}</p>
                    )}
                  </div>
                </div>

                {/* Price + status */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-[var(--color-foreground)]">{formatFCFA(b.service.price)}</p>
                  <span className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg?.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg?.dot}`} />
                    {cfg?.label}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {b.status === "PENDING" && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
                  <form action={updateBookingStatus.bind(null, b.id, "CONFIRMED")}>
                    <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors">
                      ✓ Confirmer
                    </button>
                  </form>
                  <form action={updateBookingStatus.bind(null, b.id, "CANCELLED")}>
                    <button type="submit" className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-cream)] transition-colors">
                      Annuler
                    </button>
                  </form>
                </div>
              )}
              {b.status === "CONFIRMED" && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
                  <form action={updateBookingStatus.bind(null, b.id, "COMPLETED")}>
                    <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors">
                      ✓ Marquer terminé
                    </button>
                  </form>
                  <form action={updateBookingStatus.bind(null, b.id, "NO_SHOW")}>
                    <button type="submit" className="px-4 py-2 rounded-xl border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors">
                      Absent
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
