import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { updateService } from "@/lib/actions/prestataire";
import { ServiceFormFields } from "../nouveau/page";
import Link from "next/link";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/connexion");

  const prestataire = await prisma.prestataire.findUnique({ where: { userId: session.user.id } });
  if (!prestataire) redirect("/prestataire/onboarding");

  const [service, categories] = await Promise.all([
    prisma.service.findFirst({ where: { id, prestataireId: prestataire.id, status: { not: "DELETED" } } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!service) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/prestataire/services" className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
          ← Services
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Modifier le service</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">{service.name}</p>
      </div>

      <form action={updateService.bind(null, id)} className="bg-white rounded-2xl border border-[var(--color-border)] p-6 space-y-5">
        <ServiceFormFields
          categories={categories}
          defaults={{
            name: service.name,
            description: service.description,
            categoryId: service.categoryId,
            duration: service.duration,
            price: service.price,
            photos: service.photos,
            videoUrl: service.videoUrl,
          }}
        />
        <div className="flex gap-3 pt-2">
          <Link
            href="/prestataire/services"
            className="flex-1 py-2.5 text-center rounded-full text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-cream)]"
          >
            Annuler
          </Link>
          <button type="submit" className="flex-1 py-2.5 rounded-full text-sm font-medium text-white jam-gradient hover:opacity-90">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
