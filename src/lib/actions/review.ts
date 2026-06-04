"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function submitReview(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/connexion");

  const parsed = reviewSchema.safeParse({
    bookingId: formData.get("bookingId"),
    rating: formData.get("rating"),
    comment: formData.get("comment") || undefined,
  });
  if (!parsed.success) throw new Error("Données invalides");

  const { bookingId, rating, comment } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: true },
  });

  if (!booking || booking.userId !== session.user.id) throw new Error("Réservation introuvable");
  if (booking.status !== "COMPLETED") throw new Error("Seules les réservations terminées peuvent être notées");
  if (booking.review) throw new Error("Vous avez déjà laissé un avis pour cette réservation");

  await prisma.review.create({
    data: {
      bookingId,
      prestataireId: booking.prestataireId,
      userId: session.user.id,
      rating,
      comment: comment || null,
    },
  });

  // Recalculate denormalized rating
  const agg = await prisma.review.aggregate({
    where: { prestataireId: booking.prestataireId },
    _avg: { rating: true },
    _count: true,
  });

  await prisma.prestataire.update({
    where: { id: booking.prestataireId },
    data: {
      rating: Math.round((agg._avg.rating ?? rating) * 10) / 10,
      totalReviews: agg._count,
    },
  });

  revalidatePath("/reservations");
  revalidatePath(`/prestataires`);
  redirect("/reservations?avis=ok");
}
