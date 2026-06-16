"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/utils";

// ─── Onboarding ───────────────────────────────────────────────────────────────

const onboardingSchema = z.object({
  businessName: z.string().min(2),
  description: z.string().min(10).optional().or(z.literal("")),
  city: z.string().min(2),
  address: z.string().optional().or(z.literal("")),
  phone: z.string().min(8),
  latitude: z.coerce.number().optional().or(z.literal("")),
  longitude: z.coerce.number().optional().or(z.literal("")),
});

export async function createPrestataireProfile(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "PRESTATAIRE") throw new Error("Non autorisé");

  const parsed = onboardingSchema.safeParse({
    businessName: formData.get("businessName"),
    description: formData.get("description"),
    city: formData.get("city"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
  });

  if (!parsed.success) throw new Error("Données invalides.");

  const lat = typeof parsed.data.latitude === "number" ? parsed.data.latitude : null;
  const lng = typeof parsed.data.longitude === "number" ? parsed.data.longitude : null;

  const existing = await prisma.prestataire.findUnique({ where: { userId: session.user.id } });

  if (existing) {
    // Profil pré-créé à l'inscription — on complète les infos manquantes
    const baseSlug = slugify(parsed.data.businessName);
    let slug = baseSlug;
    let i = 1;
    while (await prisma.prestataire.findUnique({ where: { slug, NOT: { userId: session.user.id } } })) {
      slug = `${baseSlug}-${i++}`;
    }
    await prisma.prestataire.update({
      where: { userId: session.user.id },
      data: {
        businessName: parsed.data.businessName,
        slug,
        description: parsed.data.description || null,
        city: parsed.data.city,
        address: parsed.data.address || null,
        phone: parsed.data.phone,
        latitude: lat,
        longitude: lng,
        enrollmentStatus: "APPROVED",
      },
    });
  } else {
    const baseSlug = slugify(parsed.data.businessName);
    let slug = baseSlug;
    let i = 1;
    while (await prisma.prestataire.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }
    await prisma.prestataire.create({
      data: {
        userId: session.user.id,
        businessName: parsed.data.businessName,
        slug,
        description: parsed.data.description || null,
        city: parsed.data.city,
        address: parsed.data.address || null,
        phone: parsed.data.phone,
        latitude: lat,
        longitude: lng,
        enrollmentStatus: "APPROVED",
      },
    });
  }

  redirect("/prestataire/services");
}

// ─── Services ─────────────────────────────────────────────────────────────────

const serviceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  duration: z.coerce.number().min(5),
  price: z.coerce.number().min(0),
});

export async function createService(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "PRESTATAIRE") throw new Error("Non autorisé");

  const prestataire = await prisma.prestataire.findUnique({ where: { userId: session.user.id } });
  if (!prestataire) throw new Error("Profil prestataire introuvable");

  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    duration: formData.get("duration"),
    price: formData.get("price"),
  });

  if (!parsed.success) throw new Error("Données invalides.");

  const photosRaw = (formData.get("photos") as string) ?? "";
  const photos = photosRaw.split(",").map((u) => u.trim()).filter((u) => u.startsWith("http"));

  await prisma.service.create({
    data: {
      prestataireId: prestataire.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      categoryId: parsed.data.categoryId || null,
      duration: parsed.data.duration,
      price: parsed.data.price,
      photos,
    },
  });

  revalidatePath("/prestataire/services");
  redirect("/prestataire/services");
}

export async function updateService(serviceId: string, formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "PRESTATAIRE") throw new Error("Non autorisé");

  const prestataire = await prisma.prestataire.findUnique({ where: { userId: session.user.id } });
  if (!prestataire) throw new Error("Profil introuvable");

  const service = await prisma.service.findFirst({
    where: { id: serviceId, prestataireId: prestataire.id },
  });
  if (!service) throw new Error("Service introuvable");

  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    duration: formData.get("duration"),
    price: formData.get("price"),
  });

  if (!parsed.success) throw new Error("Données invalides.");

  const photosRaw = (formData.get("photos") as string) ?? "";
  const photos = photosRaw.split(",").map((u) => u.trim()).filter((u) => u.startsWith("http"));

  await prisma.service.update({
    where: { id: serviceId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      categoryId: parsed.data.categoryId || null,
      duration: parsed.data.duration,
      price: parsed.data.price,
      ...(photos.length > 0 ? { photos } : {}),
    },
  });

  revalidatePath("/prestataire/services");
  redirect("/prestataire/services");
}

export async function deleteService(serviceId: string) {
  const session = await auth();
  if (!session || session.user.role !== "PRESTATAIRE") return;

  const prestataire = await prisma.prestataire.findUnique({ where: { userId: session.user.id } });
  if (!prestataire) return;

  await prisma.service.update({
    where: { id: serviceId, prestataireId: prestataire.id },
    data: { status: "DELETED" },
  });

  revalidatePath("/prestataire/services");
}

// ─── Profile update (depuis /prestataire/profil) ──────────────────────────────

type ProfileResult = { error?: string; success?: boolean };

export async function updatePrestataireProfile(
  _prev: ProfileResult | null,
  formData: FormData,
): Promise<ProfileResult> {
  const session = await auth();
  if (!session) return { error: "Non autorisé" };

  const prestataire = await prisma.prestataire.findUnique({ where: { userId: session.user.id } });
  if (!prestataire) return { error: "Profil introuvable" };

  const businessName = (formData.get("businessName") as string)?.trim();
  if (!businessName || businessName.length < 2) return { error: "Le nom d'établissement est requis." };

  const description = (formData.get("description") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim() || null;
  const latRaw = formData.get("latitude") as string;
  const lngRaw = formData.get("longitude") as string;
  const latitude = latRaw ? parseFloat(latRaw) : null;
  const longitude = lngRaw ? parseFloat(lngRaw) : null;

  await prisma.prestataire.update({
    where: { id: prestataire.id },
    data: {
      businessName,
      description,
      phone,
      address,
      city,
      latitude: latitude && !isNaN(latitude) ? latitude : null,
      longitude: longitude && !isNaN(longitude) ? longitude : null,
    },
  });

  revalidatePath("/prestataire/profil");
  revalidatePath(`/prestataires/${prestataire.slug}`);
  return { success: true };
}

// ─── Availabilities ───────────────────────────────────────────────────────────

export type AvailabilityInput = {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
};

export async function saveAvailabilities(
  availabilities: AvailabilityInput[],
): Promise<ProfileResult> {
  const session = await auth();
  if (!session) return { error: "Non autorisé" };

  const prestataire = await prisma.prestataire.findUnique({ where: { userId: session.user.id } });
  if (!prestataire) return { error: "Profil introuvable" };

  await Promise.all(
    availabilities.map(({ dayOfWeek, isActive, startTime, endTime }) =>
      prisma.availability.upsert({
        where: { prestataireId_dayOfWeek: { prestataireId: prestataire.id, dayOfWeek } },
        create: { prestataireId: prestataire.id, dayOfWeek, isActive, startTime, endTime },
        update: { isActive, startTime, endTime },
      }),
    ),
  );

  revalidatePath("/prestataire/profil");
  revalidatePath(`/prestataires/${prestataire.slug}`);
  return { success: true };
}

// ─── Booking management ───────────────────────────────────────────────────────

export async function updateBookingStatus(bookingId: string, status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW") {
  const session = await auth();
  if (!session || session.user.role !== "PRESTATAIRE") return;

  const prestataire = await prisma.prestataire.findUnique({ where: { userId: session.user.id } });
  if (!prestataire) return;

  await prisma.booking.update({
    where: { id: bookingId, prestataireId: prestataire.id },
    data: { status },
  });

  revalidatePath("/prestataire/agenda");
}
