import { NextRequest, NextResponse } from "next/server";
import { createVerify } from "crypto";
import { prisma } from "@/lib/prisma";
import type { DepositStatus } from "@/lib/pawapay";

function getWebhookPrivateKey(): string | null {
  const raw = process.env.PAWAPAY_WEBHOOK_PRIVATE_KEY;
  if (!raw) return null;
  return raw.replace(/\|/g, "\n");
}

function verifySignature(body: string, signatureB64: string): boolean {
  const pem = getWebhookPrivateKey();
  if (!pem) return true; // pas de clé configurée → accepter (dev)

  try {
    const verify = createVerify("SHA256");
    verify.update(body);
    verify.end();
    return verify.verify(pem, signatureB64, "base64");
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-pawapay-signature") ?? "";

  if (signature && !verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "signature invalide" }, { status: 401 });
  }

  let body: DepositStatus;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "payload invalide" }, { status: 400 });
  }

  const { depositId, status } = body;
  if (!depositId || !status) {
    return NextResponse.json({ error: "payload incomplet" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { externalRef: depositId } });
  if (!payment) return NextResponse.json({ ok: true });

  if (status === "COMPLETED") {
    await prisma.$transaction([
      prisma.payment.update({
        where: { externalRef: depositId },
        data: { status: "SUCCESS", paidAt: new Date() },
      }),
      prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CONFIRMED" },
      }),
    ]);
  } else if (status === "FAILED") {
    await prisma.payment.update({
      where: { externalRef: depositId },
      data: { status: "FAILED" },
    });
  }

  return NextResponse.json({ ok: true });
}
