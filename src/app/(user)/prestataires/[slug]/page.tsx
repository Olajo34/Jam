import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatFCFA } from "@/lib/utils";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function PrestatairePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();

  const prestataire = await prisma.prestataire.findUnique({
    where: { slug, enrollmentStatus: "APPROVED" },
    include: {
      services: { where: { status: "ACTIVE" }, include: { category: true }, orderBy: { price: "asc" } },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      },
      subscription: { select: { plan: true } },
      _count: { select: { reviews: true } },
    },
  });

  if (!prestataire) notFound();

  const isGold = prestataire.subscription?.plan === "GOLD";

  return (
    <div className="pb-24 sm:pb-6 max-w-3xl mx-auto">
      {/* Cover */}
      <div className="h-52 sm:h-64 rounded-2xl bg-gradient-to-br from-[var(--color-cream)] to-[var(--color-muted)] overflow-hidden relative mb-6 flex items-center justify-center">
        {prestataire.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={prestataire.coverImage} alt={prestataire.businessName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-8xl opacity-20">💆</span>
        )}
        {isGold && (
          <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-sm font-bold bg-amber-400 text-white shadow">
            ⭐ Gold
          </span>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">
            {prestataire.businessName}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-[var(--color-muted-foreground)]">
            {prestataire.city && <span>📍 {prestataire.city}{prestataire.address ? ` · ${prestataire.address}` : ""}</span>}
            {prestataire.phone && <span>📱 {prestataire.phone}</span>}
          </div>
          {prestataire.rating > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={`text-lg ${star <= Math.round(prestataire.rating) ? "text-amber-400" : "text-gray-200"}`}>★</span>
                ))}
              </div>
              <span className="text-sm font-medium text-[var(--color-foreground)]">{prestataire.rating.toFixed(1)}</span>
              <span className="text-sm text-[var(--color-muted-foreground)]">({prestataire._count.reviews} avis)</span>
            </div>
          )}
        </div>
      </div>

      {prestataire.description && (
        <p className="text-[var(--color-muted-foreground)] mb-8 leading-relaxed">{prestataire.description}</p>
      )}

      {/* Services */}
      <section className="mb-10">
        <h2 className="text-lg font-display font-semibold text-[var(--color-foreground)] mb-4">Services</h2>
        {prestataire.services.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">Aucun service disponible.</p>
        ) : (
          <div className="space-y-3">
            {prestataire.services.map((service) => (
              <div key={service.id} className="bg-white rounded-2xl border border-[var(--color-border)] p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-foreground)]">{service.name}</p>
                  {service.category && (
                    <span className="text-xs text-[var(--color-muted-foreground)] bg-[var(--color-cream)] px-2 py-0.5 rounded-full mt-1 inline-block">
                      {service.category.name}
                    </span>
                  )}
                  {service.description && (
                    <p className="text-sm text-[var(--color-muted-foreground)] mt-1 line-clamp-1">{service.description}</p>
                  )}
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-1">⏱ {service.duration} min</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[var(--color-foreground)] text-lg">{formatFCFA(service.price)}</p>
                  {session ? (
                    <Link
                      href={`/prestataires/${slug}/reserver?serviceId=${service.id}`}
                      className="inline-block mt-2 px-4 py-1.5 rounded-full text-xs font-medium text-white jam-gradient hover:opacity-90 transition-opacity"
                    >
                      Réserver
                    </Link>
                  ) : (
                    <Link
                      href={`/connexion?redirect=/prestataires/${slug}/reserver?serviceId=${service.id}`}
                      className="inline-block mt-2 px-4 py-1.5 rounded-full text-xs font-medium text-white jam-gradient hover:opacity-90 transition-opacity"
                    >
                      Réserver
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reviews */}
      {prestataire.reviews.length > 0 && (
        <section>
          <h2 className="text-lg font-display font-semibold text-[var(--color-foreground)] mb-4">
            Avis clients ({prestataire._count.reviews})
          </h2>
          <div className="space-y-3">
            {prestataire.reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl border border-[var(--color-border)] p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm text-[var(--color-foreground)]">
                    {review.user.name ?? "Client"}
                  </p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={`text-sm ${s <= review.rating ? "text-amber-400" : "text-gray-200"}`}>★</span>
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-[var(--color-muted-foreground)]">{review.comment}</p>
                )}
                <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
                  {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA fixe mobile */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 p-4 bg-white border-t border-[var(--color-border)]">
        <Link
          href={prestataire.services[0] ? `/prestataires/${slug}/reserver?serviceId=${prestataire.services[0].id}` : "#"}
          className="block w-full py-3 text-center rounded-full font-medium text-white jam-gradient"
        >
          Réserver une prestation
        </Link>
      </div>
    </div>
  );
}
