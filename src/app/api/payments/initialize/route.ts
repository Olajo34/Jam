import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializePayment } from "@/lib/notchpay";
import { calculateCommission, getCommissionRate } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { bookingId, phone } = await req.json();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId, userId: session.user.id },
    include: {
      service: true,
      prestataire: { select: { businessName: true, subscription: { select: { plan: true } } } },
      user: { select: { email: true, phone: true } },
    },
  });

  if (!booking || booking.status !== "PENDING") {
    return NextResponse.json({ error: "Réservation introuvable ou déjà payée" }, { status: 404 });
  }

  const config = await prisma.platformConfig.findUnique({ where: { id: "singleton" } })
    ?? { commissionRate: 0.07, proCommissionRate: 0.05, goldCommissionRate: 0.03 };

  const plan = booking.prestataire.subscription?.plan ?? null;
  const rate = getCommissionRate(plan, config);
  const { commission, prestataireNet } = calculateCommission(booking.service.price, rate);
  const reference = `JAM-${bookingId.slice(-8)}-${Date.now()}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://jamfeeling.com";

  await prisma.payment.upsert({
    where: { bookingId },
    create: {
      bookingId,
      amount: booking.service.price,
      commission,
      prestataireNet,
      commissionRate: rate,
      provider: "MTN",
      status: "PENDING",
      externalRef: reference,
    },
    update: { externalRef: reference, status: "PENDING" },
  });

  try {
    const result = await initializePayment({
      reference,
      amount: booking.service.price,
      email: booking.user.email,
      phone: phone || booking.user.phone || undefined,
      description: `${booking.service.name} chez ${booking.prestataire.businessName}`,
      callback: `${appUrl}/api/payments/notify`,
      redirect: `${appUrl}/reservations?paid=${bookingId}`,
    });
    return NextResponse.json({ url: result.authorization_url });
  } catch (err) {
    const cause = (err as { cause?: { code?: string } })?.cause;
    console.error("[payments/initialize] NotchPay error:", err, "cause:", cause);
    const message = err instanceof Error ? err.message : "Erreur NotchPay";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
