"use server";

import { prisma } from "@/lib/prisma";
import { signIn, signOut, auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8).optional().or(z.literal("")),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
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

  if (parsed.data.role === "PRESTATAIRE" && (!parsed.data.niu || parsed.data.niu.trim().length < 3)) {
    return { error: "Le NIU est obligatoire pour les prestataires (minimum 3 caractères)." };
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
        niu: parsed.data.niu!.trim(),
        enrollmentStatus: "APPROVED",
      },
    });
  }

  // Envoyer email de vérification
  const verifToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.verificationToken.create({
    data: { identifier: parsed.data.email, token: verifToken, expires },
  });
  await sendVerificationEmail(parsed.data.email, verifToken);

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: parsed.data.role === "PRESTATAIRE" ? "/prestataire/onboarding" : "/",
  });
  return null;
}

export async function recordFailedLogin(email: string): Promise<{ locked: boolean; minutesLeft?: number }> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { loginAttempts: true, loginLockedUntil: true },
  });
  if (!user) return { locked: false };

  if (user.loginLockedUntil && user.loginLockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.loginLockedUntil.getTime() - Date.now()) / 60000);
    return { locked: true, minutesLeft };
  }

  const newAttempts = (user.loginAttempts ?? 0) + 1;
  const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;
  await prisma.user.update({
    where: { email },
    data: {
      loginAttempts: newAttempts,
      loginLockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null,
    },
  });
  return { locked: shouldLock, minutesLeft: shouldLock ? LOCKOUT_MINUTES : undefined };
}

export async function checkLoginLock(email: string): Promise<{ locked: boolean; minutesLeft?: number }> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { loginLockedUntil: true },
  });
  if (!user?.loginLockedUntil || user.loginLockedUntil <= new Date()) return { locked: false };
  const minutesLeft = Math.ceil((user.loginLockedUntil.getTime() - Date.now()) / 60000);
  return { locked: true, minutesLeft };
}

export async function resetLoginAttempts(email: string): Promise<void> {
  await prisma.user.update({
    where: { email },
    data: { loginAttempts: 0, loginLockedUntil: null },
  }).catch(() => {});
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

export async function updateAvatar(url: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session) return { error: "Non autorisé" };
  if (!url.startsWith("https://")) return { error: "URL invalide" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: url },
  });

  revalidatePath("/profil");
  return {};
}

export async function logOut() {
  await signOut({ redirectTo: "/" });
}
