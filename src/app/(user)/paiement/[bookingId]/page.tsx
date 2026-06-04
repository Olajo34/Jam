import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { simulatePaymentSuccess } from "@/lib/actions/payment";
import { formatFCFA } from "@/lib/utils";

const PROVIDERS = [
  { id: "MTN",    label: "MTN Mobile Money",  color: "bg-yellow-400",  logo: "🟡", countries: "CI · GH · CM" },
  { id: "ORANGE", label: "Orange Money",       color: "bg-orange-500",  logo: "🟠", countries: "CI · SN · ML" },
  { id: "WAVE",   label: "Wave",               color: "bg-blue-500",    logo: "🔵", countries: "CI · SN" },
  { id: "MOOV",   label: "Moov Money",         color: "bg-blue-700",    logo: "💙", countries: "CI · BF · BJ" },
];

export default async function PaiementPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const session = await auth();
  if (!session) redirect("/connexion");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId, userId: session.user.id },
    include: {
      service: true,
      prestataire: { select: { businessName: true, slug: true } },
      payment: true,
    },
  });

  if (!booking) notFound();
  if (booking.payment?.status === "SUCCESS") redirect("/reservations");

  const config = await prisma.platformConfig.findUnique({ where: { id: "singleton" } })
    ?? { commissionRate: 0.05 };

  const commission = Math.round(booking.service.price * config.commissionRate);

  return (
    <div className="max-w-md mx-auto pb-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 jam-gradient rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4">
          💳
        </div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Paiement</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Choisissez votre opérateur mobile money</p>
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5 mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-3">Récapitulatif</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-muted-foreground)]">Prestation</span>
            <span className="font-medium">{booking.service.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-muted-foreground)]">Chez</span>
            <span className="font-medium">{booking.prestataire.businessName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-muted-foreground)]">Date</span>
            <span className="font-medium">
              {new Date(booking.scheduledAt).toLocaleDateString("fr-FR", {
                weekday: "short", day: "numeric", month: "long",
              })} à {new Date(booking.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="border-t border-[var(--color-border)] pt-2 mt-2 flex justify-between font-bold">
            <span>Total à payer</span>
            <span className="text-lg text-[var(--color-foreground)]">{formatFCFA(booking.service.price)}</span>
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)] text-right">
            dont {formatFCFA(commission)} de frais plateforme ({(config.commissionRate * 100).toFixed(0)}%)
          </p>
        </div>
      </div>

      {/* Provider selection */}
      <div className="space-y-3 mb-6">
        {PROVIDERS.map((provider) => (
          <form key={provider.id} action={simulatePaymentSuccess.bind(null, bookingId)}>
            <input type="hidden" name="provider" value={provider.id} />
            <button
              type="submit"
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-[var(--color-border)] bg-white hover:border-[var(--color-primary)]/40 hover:shadow-sm transition-all text-left"
            >
              <span className="text-2xl">{provider.logo}</span>
              <div className="flex-1">
                <p className="font-semibold text-sm text-[var(--color-foreground)]">{provider.label}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">{provider.countries}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[var(--color-foreground)]">{formatFCFA(booking.service.price)}</p>
                <p className="text-xs text-[var(--color-primary)] font-medium mt-0.5">Payer →</p>
              </div>
            </button>
          </form>
        ))}
      </div>

      <p className="text-xs text-center text-[var(--color-muted-foreground)]">
        🔒 Paiement sécurisé · Vous recevrez une confirmation par SMS
      </p>

      {/* DEV notice */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
          <strong>Mode développement</strong> — Le clic sur un opérateur simule un paiement réussi sans appel réel à CinetPay.
        </div>
      )}
    </div>
  );
}
