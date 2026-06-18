import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { formatFCFA } from "@/lib/utils";
import PaymentForm from "./PaymentForm";

export default async function PaiementPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/connexion");

  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      prestataire: { select: { businessName: true, slug: true } },
      payment: true,
    },
  });

  if (!booking || booking.userId !== session.user.id) notFound();
  if (booking.payment?.status === "SUCCESS") redirect(`/reservations`);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  });

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">
          Paiement
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
          Finalisez votre réservation par Mobile Money
        </p>
      </div>

      {/* Récapitulatif */}
      <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5 shadow-sm space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)]">
          Récapitulatif
        </p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-[var(--color-foreground)]">{booking.service.name}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {booking.prestataire.businessName}
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {new Date(booking.scheduledAt).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <p className="text-xl font-bold text-[var(--color-foreground)] shrink-0">
            {formatFCFA(booking.service.price)}
          </p>
        </div>
      </div>

      <PaymentForm
        bookingId={booking.id}
        defaultPhone={user?.phone ?? ""}
        amount={booking.service.price}
        serviceName={booking.service.name}
      />
    </div>
  );
}
