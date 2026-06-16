import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { formatFCFA, getCommissionRate } from "@/lib/utils";
import Link from "next/link";
import PaymentForm from "./PaymentForm";

export default async function PaiementPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const session = await auth();
  if (!session) redirect("/connexion");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId, userId: session.user.id },
    include: {
      service: true,
      prestataire: { select: { businessName: true, slug: true, subscription: { select: { plan: true } } } },
      payment: true,
      user: { select: { phone: true } },
    },
  });

  if (!booking) notFound();
  if (booking.payment?.status === "SUCCESS") redirect("/reservations");

  const config = await prisma.platformConfig.findUnique({ where: { id: "singleton" } })
    ?? { commissionRate: 0.07, proCommissionRate: 0.05, goldCommissionRate: 0.03 };

  const plan = booking.prestataire.subscription?.plan ?? null;
  const rate = getCommissionRate(plan, config);
  const commission = Math.round(booking.service.price * rate);

  return (
    <div className="max-w-md mx-auto pb-12">
      {/* En-tête */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 jam-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Paiement sécurisé</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Vous allez être redirigé vers NotchPay pour finaliser
        </p>
      </div>

      {/* Récapitulatif */}
      <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5 mb-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-4">
          Récapitulatif
        </p>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-muted-foreground)]">Prestation</span>
            <span className="font-medium text-[var(--color-foreground)]">{booking.service.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-muted-foreground)]">Chez</span>
            <span className="font-medium text-[var(--color-foreground)]">{booking.prestataire.businessName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-muted-foreground)]">Date</span>
            <span className="font-medium text-[var(--color-foreground)]">
              {new Date(booking.scheduledAt).toLocaleDateString("fr-FR", {
                weekday: "short", day: "numeric", month: "long",
              })}{" "}
              à{" "}
              {new Date(booking.scheduledAt).toLocaleTimeString("fr-FR", {
                hour: "2-digit", minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-muted-foreground)]">Durée</span>
            <span className="font-medium text-[var(--color-foreground)]">{booking.service.duration} min</span>
          </div>
          <div className="border-t border-[var(--color-border)] pt-3 mt-1 flex justify-between items-baseline">
            <span className="font-semibold text-[var(--color-foreground)]">Total</span>
            <span className="text-xl font-display font-semibold text-[var(--color-foreground)]">
              {formatFCFA(booking.service.price)}
            </span>
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)] text-right">
            dont {formatFCFA(commission)} de frais plateforme ({(rate * 100).toFixed(0)}%)
          </p>
        </div>
      </div>

      {/* Formulaire de paiement (client component) */}
      <PaymentForm
        bookingId={bookingId}
        defaultPhone={booking.user.phone ?? ""}
        amount={booking.service.price}
      />

      <div className="mt-4 text-center">
        <Link
          href={`/prestataires/${booking.prestataire.slug}`}
          className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
        >
          ← Annuler et retourner au profil
        </Link>
      </div>
    </div>
  );
}
