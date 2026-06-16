import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPayment, verifyWebhookSignature } from "@/lib/notchpay";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-notch-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  let event: { event: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  if (event.event !== "payment.complete") {
    return NextResponse.json({ received: true });
  }

  const reference = event.data?.reference;
  if (!reference || !reference.startsWith("SUB-")) {
    return NextResponse.json({ received: true });
  }

  let paymentData: Awaited<ReturnType<typeof verifyPayment>>;
  try {
    paymentData = await verifyPayment(reference);
  } catch {
    return NextResponse.json({ error: "Vérification échouée" }, { status: 500 });
  }

  if (paymentData.transaction?.status !== "complete") {
    return NextResponse.json({ received: true });
  }

  const amount = (paymentData.transaction as { amount?: number }).amount ?? 0;
  const config = await prisma.platformConfig.findUnique({ where: { id: "singleton" } })
    ?? { proPlanPrice: 5000, goldPlanPrice: 15000 };

  const plan = amount >= config.goldPlanPrice ? "GOLD" : "PRO";

  const rawChannel = ((paymentData.transaction as { channel?: string }).channel ?? "MTN").toUpperCase();
  const provider = (["MTN", "ORANGE", "WAVE", "MOOV"].includes(rawChannel)
    ? rawChannel
    : "MTN") as "MTN" | "ORANGE" | "WAVE" | "MOOV";

  // Identify prestataire from reference (SUB-{id.slice(-8)}-{timestamp})
  const partialId = reference.split("-")[1];
  const prestataire = await prisma.prestataire.findFirst({
    where: { id: { endsWith: partialId } },
    include: { subscription: true },
  });
  if (!prestataire) return NextResponse.json({ received: true });

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  if (prestataire.subscription) {
    await prisma.$transaction([
      prisma.subscription.update({
        where: { prestataireId: prestataire.id },
        data: { plan, status: "ACTIVE", endDate, updatedAt: new Date() },
      }),
      prisma.subscriptionPayment.create({
        data: {
          subscriptionId: prestataire.subscription.id,
          amount,
          plan,
          provider,
          externalRef: reference,
        },
      }),
    ]);
  } else {
    const sub = await prisma.subscription.create({
      data: {
        prestataireId: prestataire.id,
        plan,
        status: "ACTIVE",
        endDate,
      },
    });
    await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: sub.id,
        amount,
        plan,
        provider,
        externalRef: reference,
      },
    });
  }

  return NextResponse.json({ received: true });
}
