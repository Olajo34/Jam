import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializePayment } from "@/lib/notchpay";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { plan } = await req.json();
  if (plan !== "PRO" && plan !== "GOLD") {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  const prestataire = await prisma.prestataire.findUnique({
    where: { userId: session.user.id },
    include: { subscription: true, user: { select: { email: true } } },
  });
  if (!prestataire) return NextResponse.json({ error: "Profil prestataire introuvable" }, { status: 404 });

  const config = await prisma.platformConfig.findUnique({ where: { id: "singleton" } })
    ?? { proPlanPrice: 5000, goldPlanPrice: 15000 };

  const amount = plan === "GOLD" ? config.goldPlanPrice : config.proPlanPrice;
  const reference = `SUB-${prestataire.id}-${Date.now()}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://jamfeeling.com";

  try {
    const result = await initializePayment({
      reference,
      amount,
      email: prestataire.user.email,
      description: `Abonnement Jam ${plan} — ${prestataire.businessName}`,
      callback: `${appUrl}/api/subscriptions/notify`,
      redirect: `${appUrl}/prestataire/abonnement?processing=1`,
    });
    return NextResponse.json({ url: result.authorization_url });
  } catch (err) {
    const cause = (err as { cause?: { code?: string } })?.cause;
    console.error("[subscriptions/pay] NotchPay error:", err, "cause:", cause);
    const message = err instanceof Error ? err.message : "Erreur NotchPay";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
