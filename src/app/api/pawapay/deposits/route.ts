import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initiateDeposit, normalizeMsisdn, detectCorrespondent, type Correspondent } from "@/lib/pawapay";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { bookingId, phone, correspondent: manualCorrespondent } = await req.json();
  if (!bookingId || !phone) {
    return NextResponse.json({ error: "bookingId et phone requis" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      prestataire: { include: { subscription: true } },
      payment: true,
    },
  });

  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }
  if (booking.payment?.status === "SUCCESS") {
    return NextResponse.json({ error: "Déjà payé" }, { status: 409 });
  }

  const config = await prisma.platformConfig.findUnique({ where: { id: "singleton" } }) ?? {
    commissionRate: 0.07,
    proCommissionRate: 0.05,
    goldCommissionRate: 0.03,
  };

  const plan = booking.prestataire.subscription?.plan ?? "FREE";
  const commissionRate =
    plan === "GOLD"
      ? config.goldCommissionRate
      : plan === "PRO"
      ? config.proCommissionRate
      : config.commissionRate;

  const amount = booking.service.price;
  const commission = Math.round(amount * commissionRate);
  const prestataireNet = amount - commission;

  const msisdn = normalizeMsisdn(phone);
  const correspondent: Correspondent = manualCorrespondent ?? detectCorrespondent(msisdn);
  const depositId = randomUUID();

  const deposit = await initiateDeposit({
    depositId,
    amount: String(amount),
    currency: "XAF",
    correspondent,
    payer: { type: "MSISDN", address: { value: msisdn } },
    customerTimestamp: new Date().toISOString(),
    statementDescription: `Jam - ${booking.service.name.slice(0, 22)}`,
  });

  if (deposit.status === "REJECTED") {
    return NextResponse.json(
      { error: deposit.reason?.message ?? "Paiement refusé par l'opérateur" },
      { status: 422 }
    );
  }

  const provider = correspondent === "ORANGE_CMR" ? "ORANGE" : "MTN";

  await prisma.payment.upsert({
    where: { bookingId },
    create: {
      bookingId,
      amount,
      commission,
      prestataireNet,
      commissionRate,
      provider: provider as never,
      externalRef: depositId,
      status: "PENDING",
    },
    update: {
      externalRef: depositId,
      provider: provider as never,
      status: "PENDING",
    },
  });

  return NextResponse.json({ depositId, status: deposit.status });
}
