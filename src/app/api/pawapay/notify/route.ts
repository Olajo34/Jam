import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { DepositStatus } from "@/lib/pawapay";

export async function POST(req: NextRequest) {
  const body: DepositStatus = await req.json();
  const { depositId, status } = body;

  if (!depositId || !status) {
    return NextResponse.json({ error: "payload invalide" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { externalRef: depositId } });
  if (!payment) return NextResponse.json({ ok: true }); // inconnu, ignorer

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
