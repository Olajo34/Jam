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
  if (!reference) return NextResponse.json({ error: "Référence manquante" }, { status: 400 });

  // Vérification indépendante du statut côté NotchPay
  let paymentData: Awaited<ReturnType<typeof verifyPayment>>;
  try {
    paymentData = await verifyPayment(reference);
  } catch {
    return NextResponse.json({ error: "Vérification échouée" }, { status: 500 });
  }

  if (paymentData.transaction?.status !== "complete") {
    return NextResponse.json({ received: true });
  }

  const payment = await prisma.payment.findFirst({
    where: { externalRef: reference },
  });

  if (!payment || payment.status === "SUCCESS") {
    return NextResponse.json({ received: true });
  }

  const rawChannel = (paymentData.transaction?.channel ?? "MTN").toUpperCase();
  const provider = (["MTN", "ORANGE", "WAVE", "MOOV"].includes(rawChannel)
    ? rawChannel
    : "MTN") as "MTN" | "ORANGE" | "WAVE" | "MOOV";

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "SUCCESS", paidAt: new Date(), provider },
    }),
    prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: "CONFIRMED" },
    }),
  ]);

  return NextResponse.json({ received: true });
}
