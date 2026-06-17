"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  createWebhook,
  deleteWebhook,
} from "@/lib/notchpay";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/connexion");
}

// ── Customers ─────────────────────────────────────────────────────────────────

export async function actionCreateCustomer(formData: FormData) {
  await requireAdmin();
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const phone = (formData.get("phone") as string) || undefined;
  const description = (formData.get("description") as string) || undefined;

  if (!email || !name) return { error: "Email et nom requis." };

  try {
    await createCustomer({ email, name, phone, description });
    revalidatePath("/admin/notchpay");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

export async function actionUpdateCustomer(
  id: string,
  data: Partial<{ email: string; name: string; phone: string; description: string }>
) {
  await requireAdmin();
  try {
    await updateCustomer(id, data);
    revalidatePath("/admin/notchpay");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

export async function actionDeleteCustomer(id: string) {
  await requireAdmin();
  try {
    await deleteCustomer(id);
    revalidatePath("/admin/notchpay");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

export async function actionCreateWebhook(formData: FormData) {
  await requireAdmin();
  const url = formData.get("url") as string;
  const description = (formData.get("description") as string) || undefined;
  const eventsRaw = formData.get("events") as string;

  if (!url) return { error: "URL requise." };

  const events = eventsRaw
    ? eventsRaw.split(",").map((e) => e.trim()).filter(Boolean)
    : [
        "payment.created",
        "payment.complete",
        "payment.failed",
        "payment.expired",
        "transfer.complete",
        "transfer.failed",
        "balance.updated",
        "customer.created",
        "customer.updated",
      ];

  try {
    await createWebhook({ url, description, events });
    revalidatePath("/admin/notchpay");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

export async function actionDeleteWebhook(id: string) {
  await requireAdmin();
  try {
    await deleteWebhook(id);
    revalidatePath("/admin/notchpay");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}
