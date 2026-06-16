"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const configSchema = z.object({
  commissionRate: z.coerce.number().min(0).max(0.5),
  proCommissionRate: z.coerce.number().min(0).max(0.5),
  goldCommissionRate: z.coerce.number().min(0).max(0.5),
  proPlanPrice: z.coerce.number().min(0),
  goldPlanPrice: z.coerce.number().min(0),
  proBookingCap: z.coerce.number().min(1),
  freeBookingCap: z.coerce.number().min(1),
});

export async function savePlatformConfig(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");

  const parsed = configSchema.safeParse({
    commissionRate: formData.get("commissionRate"),
    proCommissionRate: formData.get("proCommissionRate"),
    goldCommissionRate: formData.get("goldCommissionRate"),
    proPlanPrice: formData.get("proPlanPrice"),
    goldPlanPrice: formData.get("goldPlanPrice"),
    proBookingCap: formData.get("proBookingCap"),
    freeBookingCap: formData.get("freeBookingCap"),
  });

  if (!parsed.success) return;

  await prisma.platformConfig.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...parsed.data },
    update: parsed.data,
  });

  revalidatePath("/admin/parametres");
}
