import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { deleteService } from "@/lib/actions/prestataire";
import { formatFCFA } from "@/lib/utils";
import Link from "next/link";

export default async function ServicesPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const prestataire = await prisma.prestataire.findUnique({
    where: { userId: session.user.id },
    include: {
      services: {
        where: { status: { not: "DELETED" } },
        include: { category: true },
        orderBy: { createdAt: "desc" },
      },
      subscription: true,
    },
  });

  if (!prestataire) redirect("/prestataire/onboarding");

  const activeCount = prestataire.services.filter((s) => s.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Mes services</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
            {activeCount} service{activeCount > 1 ? "s" : ""} actif{activeCount > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/prestataire/services/nouveau"
          className="px-5 py-2.5 rounded-full text-sm font-medium text-white jam-gradient hover:opacity-90 transition-opacity"
        >
          + Nouveau service
        </Link>
      </div>

      {prestataire.services.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[var(--color-border)] p-12 text-center">
          <p className="text-4xl mb-4">✂️</p>
          <p className="font-semibold text-[var(--color-foreground)] mb-2">Aucun service pour l'instant</p>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
            Ajoutez vos premières prestations pour apparaître sur la plateforme.
          </p>
          <Link
            href="/prestataire/services/nouveau"
            className="inline-flex px-6 py-2.5 rounded-full text-sm font-medium text-white jam-gradient hover:opacity-90"
          >
            Créer mon premier service
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {prestataire.services.map((service) => (
          <div key={service.id} className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden group">
            {/* Photo placeholder */}
            <div className="h-36 bg-gradient-to-br from-[var(--color-cream)] to-[var(--color-muted)] flex items-center justify-center text-4xl">
              {service.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={service.photos[0]} alt={service.name} className="w-full h-full object-cover" />
              ) : (
                <span>💆</span>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-semibold text-[var(--color-foreground)] truncate">{service.name}</p>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${service.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  {service.status === "ACTIVE" ? "Actif" : "Inactif"}
                </span>
              </div>

              {service.category && (
                <p className="text-xs text-[var(--color-muted-foreground)] mb-2">{service.category.name}</p>
              )}

              {service.description && (
                <p className="text-sm text-[var(--color-muted-foreground)] line-clamp-2 mb-3">{service.description}</p>
              )}

              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-bold text-[var(--color-foreground)]">{formatFCFA(service.price)}</span>
                  <span className="text-[var(--color-muted-foreground)] ml-1">· {service.duration} min</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
                <Link
                  href={`/prestataire/services/${service.id}`}
                  className="flex-1 py-1.5 text-center text-xs font-medium rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-cream)] transition-colors"
                >
                  Modifier
                </Link>
                <form action={deleteService.bind(null, service.id)}>
                  <button
                    type="submit"
                    className="py-1.5 px-3 text-xs font-medium rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Supprimer
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
