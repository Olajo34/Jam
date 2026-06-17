"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteUser(userId: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") throw new Error("Non autorisé");
  if (userId === session.user.id) throw new Error("Vous ne pouvez pas supprimer votre propre compte.");

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) throw new Error("Utilisateur introuvable.");
  if (target.role === "ADMIN") throw new Error("Impossible de supprimer un compte Admin.");

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/utilisateurs");
}

export async function changeUserRole(userId: string, formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") throw new Error("Non autorisé");
  if (userId === session.user.id) throw new Error("Vous ne pouvez pas modifier votre propre rôle.");

  const newRole = formData.get("newRole") as string;
  if (!["USER", "PRESTATAIRE", "MODERATEUR"].includes(newRole)) throw new Error("Rôle invalide.");

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole as "USER" | "PRESTATAIRE" | "MODERATEUR" },
  });

  revalidatePath("/admin/utilisateurs");
}

// ─── Conformité prestataires ──────────────────────────────────────────────────

export async function sendReminderToPrestataire(prestataireId: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") throw new Error("Non autorisé");

  await prisma.prestataire.update({
    where: { id: prestataireId },
    data: { lastReminderAt: new Date() },
  });

  revalidatePath("/admin/prestataires");
}

export async function suspendPrestataire(prestataireId: string, reason: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") throw new Error("Non autorisé");

  const prestataire = await prisma.prestataire.update({
    where: { id: prestataireId },
    data: {
      suspendedAt: new Date(),
      suspendedReason: reason.trim(),
      enrollmentStatus: "REJECTED",
    },
    select: { userId: true },
  });

  // Supprimer les sessions DB actives (OAuth/magic-link) — force re-auth immédiat
  await prisma.session.deleteMany({ where: { userId: prestataire.userId } });

  revalidatePath("/admin/prestataires");
}

export async function reinstatePrestataire(prestataireId: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") throw new Error("Non autorisé");

  await prisma.prestataire.update({
    where: { id: prestataireId },
    data: {
      suspendedAt: null,
      suspendedReason: null,
      enrollmentStatus: "APPROVED",
    },
  });

  revalidatePath("/admin/prestataires");
}

export async function terminatePrestataire(userId: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") throw new Error("Non autorisé");

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) throw new Error("Utilisateur introuvable.");
  if (target.role === "ADMIN") throw new Error("Impossible de résilier un compte Admin.");

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/prestataires");
}
