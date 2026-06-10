"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveAvailability(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "PRESTATAIRE") throw new Error("Non autorisé");

  const prestataire = await prisma.prestataire.findUnique({ where: { userId: session.user.id } });
  if (!prestataire) throw new Error("Profil introuvable");

  const days = [0, 1, 2, 3, 4, 5, 6];

  for (const day of days) {
    const isActive = formData.get(`day_${day}_active`) === "on";
    const startTime = (formData.get(`day_${day}_start`) as string) || "09:00";
    const endTime = (formData.get(`day_${day}_end`) as string) || "18:00";

    await prisma.availability.upsert({
      where: { prestataireId_dayOfWeek: { prestataireId: prestataire.id, dayOfWeek: day } },
      create: { prestataireId: prestataire.id, dayOfWeek: day, startTime, endTime, isActive },
      update: { startTime, endTime, isActive },
    });
  }

  revalidatePath("/prestataire/agenda");
}

export async function addUnavailableDate(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "PRESTATAIRE") throw new Error("Non autorisé");

  const prestataire = await prisma.prestataire.findUnique({ where: { userId: session.user.id } });
  if (!prestataire) throw new Error("Profil introuvable");

  const dateStr = formData.get("date") as string;
  const reason = (formData.get("reason") as string) || null;
  if (!dateStr) throw new Error("Date invalide");

  await prisma.unavailableDate.create({
    data: { prestataireId: prestataire.id, date: new Date(dateStr), reason },
  });

  revalidatePath("/prestataire/agenda");
}

export async function removeUnavailableDate(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "PRESTATAIRE") return;

  const prestataire = await prisma.prestataire.findUnique({ where: { userId: session.user.id } });
  if (!prestataire) return;

  await prisma.unavailableDate.deleteMany({
    where: { id, prestataireId: prestataire.id },
  });

  revalidatePath("/prestataire/agenda");
}

export async function addBlockedSlot(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "PRESTATAIRE") throw new Error("Non autorisé");

  const prestataire = await prisma.prestataire.findUnique({ where: { userId: session.user.id } });
  if (!prestataire) throw new Error("Profil introuvable");

  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const reason = (formData.get("reason") as string) || null;

  if (!date || !time) throw new Error("Date et heure requises");

  await prisma.blockedSlot.upsert({
    where: { prestataireId_date_time: { prestataireId: prestataire.id, date, time } },
    create: { prestataireId: prestataire.id, date, time, reason },
    update: { reason },
  });

  revalidatePath("/prestataire/agenda");
}

export async function removeBlockedSlot(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "PRESTATAIRE") return;

  const prestataire = await prisma.prestataire.findUnique({ where: { userId: session.user.id } });
  if (!prestataire) return;

  await prisma.blockedSlot.deleteMany({
    where: { id, prestataireId: prestataire.id },
  });

  revalidatePath("/prestataire/agenda");
}
