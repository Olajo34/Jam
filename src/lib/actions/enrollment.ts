"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function checkModerator() {
  const session = await auth();
  if (!session || !["MODERATEUR", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }
}

export async function approveEnrollment(prestataireId: string) {
  await checkModerator();

  await prisma.$transaction([
    prisma.prestataire.update({
      where: { id: prestataireId },
      data: { enrollmentStatus: "APPROVED" },
    }),
    prisma.subscription.upsert({
      where: { prestataireId },
      create: { prestataireId, plan: "FREE", status: "ACTIVE" },
      update: {},
    }),
  ]);

  revalidatePath("/moderateur/enrollments");
  revalidatePath("/admin/dashboard");
}

export async function rejectEnrollment(prestataireId: string, reason: string) {
  await checkModerator();

  await prisma.prestataire.update({
    where: { id: prestataireId },
    data: { enrollmentStatus: "REJECTED" },
  });

  revalidatePath("/moderateur/enrollments");
  revalidatePath("/admin/dashboard");
}

export async function setInReview(prestataireId: string) {
  await checkModerator();

  await prisma.prestataire.update({
    where: { id: prestataireId },
    data: { enrollmentStatus: "IN_REVIEW" },
  });

  revalidatePath("/moderateur/enrollments");
}
