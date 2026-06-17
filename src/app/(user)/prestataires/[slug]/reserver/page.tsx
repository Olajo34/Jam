import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { createBooking } from "@/lib/actions/booking";
import { formatFCFA } from "@/lib/utils";
import Link from "next/link";

export default async function ReserverPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ serviceId?: string }>;
}) {
  const { slug } = await params;
  const { serviceId } = await searchParams;
  const session = await auth();
  if (!session) {
    const returnUrl = `/prestataires/${slug}/reserver${serviceId ? `?serviceId=${serviceId}` : ""}`;
    redirect(`/connexion?redirect=${encodeURIComponent(returnUrl)}`);
  }

  const prestataire = await prisma.prestataire.findUnique({
    where: { slug, enrollmentStatus: "APPROVED" },
    include: {
      services: { where: { status: "ACTIVE" }, include: { category: true }, orderBy: { price: "asc" } },
      availabilities: { where: { isActive: true } },
      unavailableDates: { where: { date: { gte: new Date() } } },
    },
  });
  if (!prestataire) notFound();
  if (prestataire.services.length === 0) redirect(`/prestataires/${slug}`);

  const selectedService = serviceId
    ? prestataire.services.find((s) => s.id === serviceId) ?? prestataire.services[0]
    : prestataire.services[0];

  const today = new Date();
  const in14Days = new Date(today);
  in14Days.setDate(today.getDate() + 15);

  // Créneaux déjà réservés (PENDING ou CONFIRMED)
  const activeBookings = await prisma.booking.findMany({
    where: {
      prestataireId: prestataire.id,
      status: { in: ["PENDING", "CONFIRMED"] },
      scheduledAt: { gte: today, lte: in14Days },
    },
    select: { scheduledAt: true },
  });

  // Créneaux bloqués manuellement par le prestataire
  const blockedSlots = await prisma.blockedSlot.findMany({
    where: { prestataireId: prestataire.id },
    select: { date: true, time: true, reason: true },
  });

  // Clés indisponibles : "YYYY-MM-DDTHH:MM"
  const bookedKeys = new Set(
    activeBookings.map((b) => {
      const iso = new Date(b.scheduledAt).toISOString();
      return iso.substring(0, 16); // "2025-01-15T09:00"
    })
  );
  const blockedKeys = new Set(blockedSlots.map((s) => `${s.date}T${s.time}`));
  const allUnavailable = new Set([...bookedKeys, ...blockedKeys]);

  // Jours bloqués entiers
  const blockedDates = new Set(
    prestataire.unavailableDates.map((d) => new Date(d.date).toISOString().split("T")[0])
  );

  // Générer les créneaux sur 14 jours
  const slots: { date: string; label: string; times: { time: string; available: boolean }[] }[] = [];

  for (let d = 0; d < 14; d++) {
    const day = new Date(today);
    day.setDate(today.getDate() + d + 1);
    const dateStr = day.toISOString().split("T")[0];
    const dayOfWeek = day.getDay();

    if (blockedDates.has(dateStr)) continue;

    const avail = prestataire.availabilities.find((a) => a.dayOfWeek === dayOfWeek);
    let rawTimes: string[];

    if (avail) {
      rawTimes = [];
      const [startH, startM] = avail.startTime.split(":").map(Number);
      const [endH] = avail.endTime.split(":").map(Number);
      for (let h = startH; h < endH; h++) {
        rawTimes.push(`${String(h).padStart(2, "0")}:${String(startM || 0).padStart(2, "0")}`);
      }
    } else {
      rawTimes = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
    }

    if (rawTimes.length === 0) continue;

    const times = rawTimes.map((time) => ({
      time,
      available: !allUnavailable.has(`${dateStr}T${time}`),
    }));

    // N'afficher que s'il reste au moins un créneau disponible
    const hasAvailable = times.some((t) => t.available);
    if (!hasAvailable && times.length > 0) {
      // Afficher quand même le jour, tous grisés — meilleure UX
    }

    const label = day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    slots.push({ date: dateStr, label, times });

    if (slots.length >= 7) break;
  }

  const availableCount = slots.reduce((acc, s) => acc + s.times.filter((t) => t.available).length, 0);

  return (
    <div className="max-w-xl mx-auto pb-24 sm:pb-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/prestataires/${slug}`} className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
          ← {prestataire.businessName}
        </Link>
      </div>

      <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)] mb-1">
        Réserver une prestation
      </h1>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
        {availableCount} créneau{availableCount > 1 ? "x" : ""} disponible{availableCount > 1 ? "s" : ""} dans les 14 prochains jours
      </p>

      <form action={createBooking} className="space-y-6">
        <input type="hidden" name="prestataireId" value={prestataire.id} />

        {/* Service */}
        <section className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5 space-y-3">
          <h2 className="font-semibold text-[var(--color-foreground)]">1. Choisir une prestation</h2>
          <div className="space-y-2">
            {prestataire.services.map((service) => (
              <label
                key={service.id}
                className="flex items-center justify-between gap-4 p-3 rounded-xl border border-[var(--color-border)] cursor-pointer has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[var(--color-primary)]/5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="radio"
                    name="serviceId"
                    value={service.id}
                    defaultChecked={service.id === selectedService.id}
                    className="accent-[var(--color-primary)]"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-[var(--color-foreground)] truncate">{service.name}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">⏱ {service.duration} min</p>
                  </div>
                </div>
                <p className="font-bold text-[var(--color-foreground)] shrink-0">{formatFCFA(service.price)}</p>
              </label>
            ))}
          </div>
        </section>

        {/* Créneaux */}
        <section className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-[var(--color-foreground)]">2. Choisir un créneau</h2>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
              Les créneaux grisés sont déjà réservés ou indisponibles.
            </p>
          </div>

          {slots.length === 0 && (
            <div className="text-center py-8 text-[var(--color-muted-foreground)]">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-sm font-medium">Aucun créneau disponible dans les 14 prochains jours.</p>
              <p className="text-xs mt-1">Revenez plus tard ou contactez le prestataire directement.</p>
            </div>
          )}

          <div className="space-y-3">
            {slots.map(({ date, label, times }) => {
              const dayAvailable = times.some((t) => t.available);
              return (
                <details key={date} open={dayAvailable && slots.indexOf(slots.find(s => s.date === date)!) === 0}>
                  <summary className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer list-none transition-colors ${
                    dayAvailable
                      ? "bg-[var(--color-background)] hover:bg-[var(--color-muted)]/30"
                      : "bg-[var(--color-muted)]/20 opacity-60"
                  }`}>
                    <span className="text-sm font-medium text-[var(--color-foreground)] capitalize">{label}</span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {dayAvailable
                        ? `${times.filter(t => t.available).length} libre${times.filter(t => t.available).length > 1 ? "s" : ""}`
                        : "Complet"}
                    </span>
                  </summary>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-2 px-1">
                    {times.map(({ time, available }) => (
                      <label key={time} className={`cursor-pointer ${!available ? "cursor-not-allowed" : ""}`}>
                        <input
                          type="radio"
                          name="scheduledAt"
                          value={`${date}T${time}:00.000Z`}
                          disabled={!available}
                          className="sr-only peer"
                        />
                        <div className={`text-center py-2 rounded-xl border text-xs font-medium transition-all ${
                          available
                            ? "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 peer-checked:bg-[var(--color-primary)] peer-checked:text-white peer-checked:border-[var(--color-primary)]"
                            : "border-[var(--color-muted)]/40 bg-[var(--color-muted)]/20 text-[var(--color-muted-foreground)] line-through"
                        }`}>
                          {time}
                        </div>
                      </label>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        {/* Notes */}
        <section className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5 space-y-3">
          <h2 className="font-semibold text-[var(--color-foreground)]">
            3. Notes <span className="font-normal text-[var(--color-muted-foreground)] text-sm">(optionnel)</span>
          </h2>
          <textarea
            name="notes"
            rows={2}
            placeholder="Informations utiles pour le prestataire…"
            className="input-base resize-none"
          />
        </section>

        {/* Récap + CTA */}
        <div className="jam-gradient rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold">{selectedService.name}</p>
              <p className="text-sm text-white/70">{prestataire.businessName} · {selectedService.duration} min</p>
            </div>
            <p className="text-2xl font-display font-light">{formatFCFA(selectedService.price)}</p>
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-full bg-white text-[var(--color-primary)] font-semibold text-sm hover:bg-white/92 transition"
          >
            Confirmer et payer →
          </button>
        </div>
      </form>
    </div>
  );
}
