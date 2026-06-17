"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calculateCommission } from "@/lib/utils";
import { redirect } from "next/navigation";

export async function initiateMobileMoneyPayment(bookingId: string, provider: string) {
  const session = await auth();
  if (!session) redirect("/connexion");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId, userId: session.user.id },
    include: { service: true },
  });
  if (!booking) throw new Error("Réservation introuvable");

  const config = await prisma.platformConfig.findUnique({ where: { id: "singleton" } })
    ?? { commissionRate: 0.05 };

  const { commission, prestataireNet } = calculateCommission(booking.service.price, config.commissionRate);

  // Create payment record (pending)
  await prisma.payment.upsert({
    where: { bookingId },
    create: {
      bookingId,
      amount: booking.service.price,
      commission,
      prestataireNet,
      commissionRate: config.commissionRate,
      provider: provider as "MTN" | "ORANGE" | "WAVE" | "MOOV",
      status: "PENDING",
    },
    update: {
      provider: provider as "MTN" | "ORANGE" | "WAVE" | "MOOV",
    },
  });

  // TODO: call CinetPay/NotchPay API here
  // For now simulate success after 2s in the UI
  return { bookingId, amount: booking.service.price, provider };
}

export async function simulatePaymentSuccess(bookingId: string, formData: FormData) {
  if (process.env.NODE_ENV !== "development") throw new Error("Non autorisé");

  const session = await auth();
  if (!session) redirect("/connexion");

  const provider = (formData.get("provider") as string) ?? "MTN";

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId, userId: session.user.id },
    include: { service: true },
  });
  if (!booking) throw new Error("Réservation introuvable");

  const config = await prisma.platformConfig.findUnique({ where: { id: "singleton" } })
    ?? { commissionRate: 0.05 };

  const { commission, prestataireNet } = calculateCommission(booking.service.price, config.commissionRate);

  await prisma.$transaction([
    prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        amount: booking.service.price,
        commission,
        prestataireNet,
        commissionRate: config.commissionRate,
        provider: provider as "MTN" | "ORANGE" | "WAVE" | "MOOV",
        status: "SUCCESS",
        paidAt: new Date(),
      },
      update: {
        provider: provider as "MTN" | "ORANGE" | "WAVE" | "MOOV",
        status: "SUCCESS",
        paidAt: new Date(),
      },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
    }),
  ]);

  redirect(`/reservations?success=${bookingId}`);
}
