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
  if (!session) redirect(`/connexion`);

  const prestataire = await prisma.prestataire.findUnique({
    where: { slug, enrollmentStatus: "APPROVED" },
    include: {
      services: { where: { status: "ACTIVE" }, include: { category: true }, orderBy: { price: "asc" } },
    },
  });
  if (!prestataire) notFound();
  if (prestataire.services.length === 0) redirect(`/prestataires/${slug}`);

  const selectedService = serviceId
    ? prestataire.services.find((s) => s.id === serviceId) ?? prestataire.services[0]
    : prestataire.services[0];

  // Generate next 7 days time slots
  const today = new Date();
  const slots: { date: string; label: string; times: string[] }[] = [];
  for (let d = 0; d < 7; d++) {
    const day = new Date(today);
    day.setDate(today.getDate() + d + 1);
    const dateStr = day.toISOString().split("T")[0];
    const label = day.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
    const times = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
    slots.push({ date: dateStr, label, times });
  }

  return (
    <div className="max-w-xl mx-auto pb-24 sm:pb-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/prestataires/${slug}`} className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
          ← {prestataire.businessName}
        </Link>
      </div>

      <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)] mb-6">
        Réserver une prestation
      </h1>

      <form action={createBooking} className="space-y-6">
        <input type="hidden" name="prestataireId" value={prestataire.id} />

        {/* Service selection */}
        <section className="bg-white rounded-2xl border border-[var(--color-border)] p-5 space-y-3">
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

        {/* Date & time */}
        <section className="bg-white rounded-2xl border border-[var(--color-border)] p-5 space-y-4">
          <h2 className="font-semibold text-[var(--color-foreground)]">2. Choisir un créneau</h2>

          <div className="space-y-3">
            {slots.map(({ date, label, times }) => (
              <details key={date} className="group">
                <summary className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[var(--color-cream)] cursor-pointer list-none">
                  <span className="text-sm font-medium text-[var(--color-foreground)] capitalize">{label}</span>
                  <span className="text-xs text-[var(--color-muted-foreground)] group-open:hidden">Voir les créneaux</span>
                  <span className="text-xs text-[var(--color-muted-foreground)] hidden group-open:block">▲</span>
                </summary>
                <div className="grid grid-cols-4 gap-2 mt-2 px-1">
                  {times.map((time) => {
                    const iso = `${date}T${time}:00.000Z`;
                    return (
                      <label key={time} className="cursor-pointer">
                        <input type="radio" name="scheduledAt" value={iso} className="sr-only peer" />
                        <div className="text-center py-2 rounded-xl border border-[var(--color-border)] text-sm peer-checked:bg-[var(--color-primary)] peer-checked:text-white peer-checked:border-[var(--color-primary)] hover:bg-[var(--color-cream)] transition-colors">
                          {time}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Notes */}
        <section className="bg-white rounded-2xl border border-[var(--color-border)] p-5 space-y-3">
          <h2 className="font-semibold text-[var(--color-foreground)]">
            3. Notes <span className="font-normal text-[var(--color-muted-foreground)] text-sm">(optionnel)</span>
          </h2>
          <textarea
            name="notes"
            rows={2}
            placeholder="Informations utiles pour le prestataire..."
            className="input-base resize-none"
          />
        </section>

        {/* Summary + CTA */}
        <div className="bg-[var(--color-primary)] rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold">{selectedService.name}</p>
              <p className="text-sm text-white/70">{prestataire.businessName} · {selectedService.duration} min</p>
            </div>
            <p className="text-2xl font-display font-bold">{formatFCFA(selectedService.price)}</p>
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-full bg-white text-[var(--color-primary)] font-semibold hover:bg-white/90 transition-opacity"
          >
            Confirmer et payer
          </button>
        </div>
      </form>
    </div>
  );
}
