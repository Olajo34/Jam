"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { calculateCommission } from "@/lib/utils";

const bookingSchema = z.object({
  prestataireId: z.string(),
  serviceId: z.string(),
  scheduledAt: z.string().datetime(),
  notes: z.string().max(1000).optional(),
});

export async function createBooking(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/connexion");

  const parsed = bookingSchema.safeParse({
    prestataireId: formData.get("prestataireId"),
    serviceId: formData.get("serviceId"),
    scheduledAt: formData.get("scheduledAt"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) throw new Error("Données invalides");

  const service = await prisma.service.findUnique({
    where: { id: parsed.data.serviceId, status: "ACTIVE" },
  });
  if (!service) throw new Error("Service introuvable");

  // Check subscription cap
  const sub = await prisma.subscription.findUnique({
    where: { prestataireId: parsed.data.prestataireId },
  });
  const config = await prisma.platformConfig.findUnique({ where: { id: "singleton" } })
    ?? { freeBookingCap: 10, proBookingCap: 100 };

  if (sub) {
    const cap = sub.plan === "GOLD" ? Infinity
      : sub.plan === "PRO" ? config.proBookingCap
      : config.freeBookingCap;
    if (sub.monthlyCount >= cap) throw new Error("Ce prestataire a atteint sa limite de réservations ce mois-ci.");
  }

  const booking = await prisma.booking.create({
    data: {
      userId: session.user.id,
      prestataireId: parsed.data.prestataireId,
      serviceId: parsed.data.serviceId,
      scheduledAt: new Date(parsed.data.scheduledAt),
      durationMins: service.duration,
      notes: parsed.data.notes || null,
      status: "PENDING",
    },
  });

  // Increment monthly count
  if (sub) {
    await prisma.subscription.update({
      where: { prestataireId: parsed.data.prestataireId },
      data: { monthlyCount: { increment: 1 } },
    });
  }

  redirect(`/reservations?nouveau=${booking.id}`);
}

export async function cancelBooking(bookingId: string) {
  const session = await auth();
  if (!session) return;

  await prisma.booking.updateMany({
    where: { id: bookingId, userId: session.user.id, status: { in: ["PENDING", "CONFIRMED"] } },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/reservations");
}
