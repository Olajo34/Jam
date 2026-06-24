import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cancelBooking } from "@/lib/actions/booking";
import { formatFCFA } from "@/lib/utils";
import Link from "next/link";
import { CalendarDays, CheckCircle2, MapPin, CreditCard, Star } from "lucide-react";

const STATUS_CONFIG = {
  PENDING:   { label: "En attente",  color: "bg-amber-100 text-amber-700",     dot: "bg-amber-400" },
  CONFIRMED: { label: "Confirmé",    color: "bg-blue-100 text-blue-700",       dot: "bg-blue-400" },
  COMPLETED: { label: "Terminé",     color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
  CANCELLED: { label: "Annulé",      color: "bg-gray-100 text-gray-500",       dot: "bg-gray-300" },
  NO_SHOW:   { label: "Absent",      color: "bg-red-100 text-red-600",         dot: "bg-red-400" },
};

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;
  const session = await auth();
  if (!session) redirect("/connexion");

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: {
      service: { select: { name: true, duration: true, price: true } },
      prestataire: { select: { businessName: true, slug: true, city: true } },
      payment: { select: { status: true } },
      review: { select: { id: true } },
    },
    orderBy: { scheduledAt: "desc" },
  });

  const upcoming = bookings.filter((b) => new Date(b.scheduledAt) > new Date() && b.status !== "CANCELLED");
  const past = bookings.filter((b) => new Date(b.scheduledAt) <= new Date() || b.status === "CANCELLED");

  return (
    <div className="space-y-8 pb-20 sm:pb-6">
      {/* Success banner */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 size={22} className="text-emerald-600 shrink-0" strokeWidth={2} />
          <div>
            <p className="font-semibold text-emerald-800">Paiement confirmé !</p>
            <p className="text-sm text-emerald-600">Votre réservation a été enregistrée. Le prestataire vous contactera pour confirmer.</p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Mes réservations</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">{bookings.length} réservation{bookings.length > 1 ? "s" : ""} au total</p>
      </div>

      {bookings.length === 0 && (
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-[var(--color-cream)] flex items-center justify-center mx-auto mb-4">
            <CalendarDays size={26} className="text-[var(--color-muted-foreground)]" strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-[var(--color-foreground)] mb-2">Aucune réservation</p>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-6">Explorez nos prestataires et réservez votre première prestation.</p>
          <Link href="/recherche" className="inline-flex px-6 py-2.5 rounded-full text-sm font-medium text-white jam-gradient hover:opacity-90 transition-opacity">
            Explorer les prestataires
          </Link>
        </div>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">À venir</h2>
          <div className="space-y-3">
            {upcoming.map((b) => <BookingCard key={b.id} booking={b} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">Passées</h2>
          <div className="space-y-3">
            {past.map((b) => <BookingCard key={b.id} booking={b} />)}
          </div>
        </section>
      )}
    </div>
  );
}

type BookingWithRelations = Awaited<ReturnType<typeof prisma.booking.findMany>>[number] & {
  service: { name: string; duration: number; price: number };
  prestataire: { businessName: string; slug: string; city: string | null };
  payment: { status: string } | null;
  review: { id: string } | null;
};

function BookingCard({ booking: b }: { booking: BookingWithRelations }) {
  const cfg = STATUS_CONFIG[b.status as keyof typeof STATUS_CONFIG];
  const scheduledDate = new Date(b.scheduledAt);
  const isUpcoming = scheduledDate > new Date() && b.status !== "CANCELLED";
  const canCancel = isUpcoming && ["PENDING", "CONFIRMED"].includes(b.status);
  const canReview = b.status === "COMPLETED" && !b.review;

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
      <div className="flex items-start justify-between gap-4">
        {/* Date block */}
        <div className="text-center bg-[var(--color-cream)] rounded-xl px-3 py-2 shrink-0 w-16">
          <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
            {scheduledDate.toLocaleDateString("fr-FR", { month: "short" })}
          </p>
          <p className="text-2xl font-bold text-[var(--color-foreground)] leading-none">
            {scheduledDate.getDate()}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
            {scheduledDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--color-foreground)] truncate">{b.service.name}</p>
          <Link href={`/prestataires/${b.prestataire.slug}`} className="text-sm text-[var(--color-primary)] hover:underline truncate block">
            {b.prestataire.businessName}
          </Link>
          {b.prestataire.city && (
            <p className="text-xs text-[var(--color-muted-foreground)] flex items-center gap-1">
              <MapPin size={10} strokeWidth={2} />
              {b.prestataire.city}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg?.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg?.dot}`} />
              {cfg?.label}
            </span>
            {b.payment?.status === "SUCCESS" && (
              <span className="text-xs text-emerald-600 font-medium">· Payé</span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          <p className="font-bold text-[var(--color-foreground)]">{formatFCFA(b.service.price)}</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">{b.service.duration} min</p>
        </div>
      </div>

      {/* Actions */}
      {(canCancel || canReview || b.payment?.status === "PENDING") && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
          {b.payment?.status === "PENDING" && (
            <Link
              href={`/paiement/${b.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white jam-gradient hover:opacity-90 transition-opacity"
            >
              <CreditCard size={12} strokeWidth={2} />
              Finaliser le paiement
            </Link>
          )}
          {canReview && (
            <Link
              href={`/prestataires/${b.prestataire.slug}?avis=${b.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <Star size={12} fill="currentColor" strokeWidth={0} />
              Laisser un avis
            </Link>
          )}
          {canCancel && (
            <form action={cancelBooking.bind(null, b.id)}>
              <button type="submit" className="px-4 py-2 rounded-xl text-xs font-medium border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-cream)]">
                Annuler
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
