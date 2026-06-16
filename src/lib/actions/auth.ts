"use server";

import { prisma } from "@/lib/prisma";
import { signIn, signOut, auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8).optional().or(z.literal("")),
  password: z.string().min(6),
  role: z.enum(["USER", "PRESTATAIRE"]).default("USER"),
  niu: z.string().min(3).optional().or(z.literal("")),
});

export async function registerUser(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    password: formData.get("password"),
    role: formData.get("role") ?? "USER",
    niu: formData.get("niu") ?? "",
  });

  if (!parsed.success) return { error: "Données invalides. Vérifiez les champs." };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "Un compte existe déjà avec cet email." };

  if (parsed.data.role === "PRESTATAIRE" && !parsed.data.niu) {
    return { error: "Le NIU est obligatoire pour les prestataires." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  let user: { id: string };
  try {
    user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        passwordHash,
        role: parsed.data.role,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const fields = (err.meta?.target as string[]) ?? [];
      if (fields.includes("phone")) return { error: "Ce numéro de téléphone est déjà associé à un compte." };
      return { error: "Un compte existe déjà avec ces informations." };
    }
    return { error: "Une erreur est survenue. Veuillez réessayer." };
  }

  if (parsed.data.role === "PRESTATAIRE" && parsed.data.niu) {
    const slug = `${parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${user.id.slice(-4)}`;
    await prisma.prestataire.create({
      data: {
        userId: user.id,
        businessName: parsed.data.name,
        slug,
        niu: parsed.data.niu,
        enrollmentStatus: "APPROVED",
      },
    });
  }

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: parsed.data.role === "PRESTATAIRE" ? "/prestataire/onboarding" : "/",
  });
  return null;
}

const updateProfileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8).optional().or(z.literal("")),
});

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/connexion");

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) throw new Error("Données invalides.");

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
    },
  });

  revalidatePath("/profil");
}

export async function logOut() {
  await signOut({ redirectTo: "/" });
}
