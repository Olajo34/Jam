import { prisma } from "@/lib/prisma";
import { haversineKm, formatDistance, resolveCoords, planRank } from "@/lib/utils";
import { GeolocationButton } from "@/components/shared/GeolocationButton";
import Link from "next/link";
import { Suspense } from "react";

const CITIES = ["Douala", "Yaoundé", "Bafoussam", "Bamenda", "Garoua", "Kribi", "Limbé", "Ngaoundéré"];

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ville?: string; categorie?: string; lat?: string; lng?: string }>;
}) {
  const { q, ville, categorie, lat, lng } = await searchParams;

  const userLat = lat ? parseFloat(lat) : null;
  const userLng = lng ? parseFloat(lng) : null;
  const hasGeo = userLat !== null && userLng !== null;

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  const allPrestataires = await prisma.prestataire.findMany({
    where: {
      enrollmentStatus: "APPROVED",
      ...(!hasGeo && ville ? { city: ville } : {}),
      ...(q ? { businessName: { contains: q, mode: "insensitive" } } : {}),
      ...(categorie
        ? { services: { some: { category: { slug: categorie }, status: "ACTIVE" } } }
        : {}),
    },
    include: {
      services: { where: { status: "ACTIVE" }, select: { price: true, name: true, duration: true, photos: true }, take: 10 },
      subscription: { select: { plan: true } },
      _count: { select: { reviews: true } },
    },
  });

  const prestataires = allPrestataires;

  // Compute distance for each prestataire
  type WithDistance = (typeof prestataires)[number] & { distanceKm: number | null };

  const withDistance: WithDistance[] = prestataires.map((p) => {
    if (!hasGeo) return { ...p, distanceKm: null };
    const coords = resolveCoords(p.latitude, p.longitude, p.city);
    if (!coords) return { ...p, distanceKm: null };
    return { ...p, distanceKm: haversineKm(userLat!, userLng!, coords.lat, coords.lng) };
  });

  // Sort: planRank ASC (Gold first), then distance ASC (null last), then rating DESC
  withDistance.sort((a, b) => {
    const planDiff = planRank(a.subscription?.plan) - planRank(b.subscription?.plan);
    if (planDiff !== 0) return planDiff;
    if (hasGeo) {
      if (a.distanceKm === null && b.distanceKm === null) return b.rating - a.rating;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    }
    return b.rating - a.rating;
  });

  const gold = withDistance.filter((p) => p.subscription?.plan === "GOLD");
  const pro  = withDistance.filter((p) => p.subscription?.plan === "PRO");
  const free = withDistance.filter((p) => !["GOLD", "PRO"].includes(p.subscription?.plan ?? ""));

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">
          Explorer les prestataires
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
          {withDistance.length} prestataire{withDistance.length > 1 ? "s" : ""} disponible{withDistance.length > 1 ? "s" : ""}
          {hasGeo && " · triés par distance"}
        </p>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 items-start">
        <input
          name="q" defaultValue={q}
          placeholder="Nom du prestataire..."
          className="px-4 py-2 text-sm rounded-full border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-48"
        />
        {/* Ville désactivée quand géoloc active */}
        {!hasGeo && (
          <select
            name="ville" defaultValue={ville ?? ""}
            className="px-4 py-2 text-sm rounded-full border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="">Toutes les villes</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <select
          name="categorie" defaultValue={categorie ?? ""}
          className="px-4 py-2 text-sm rounded-full border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="">Toutes catégories</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <button type="submit" className="px-5 py-2 rounded-full text-sm font-medium text-white jam-gradient hover:opacity-90">
          Rechercher
        </button>
        {(q || ville || categorie) && (
          <a href={hasGeo ? `/recherche?lat=${lat}&lng=${lng}` : "/recherche"}
            className="px-5 py-2 rounded-full text-sm border border-[var(--color-border)] bg-white hover:bg-[var(--color-cream)]">
            Effacer
          </a>
        )}

        {/* Géolocalisation — client component dans Suspense */}
        <Suspense>
          <GeolocationButton />
        </Suspense>
      </form>

      {/* Bandeau géoloc actif */}
      {hasGeo && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-sm text-[var(--color-primary)] w-fit font-medium">
          <span>📍</span>
          Résultats triés par distance depuis votre position · Pro &amp; Gold mis en avant
        </div>
      )}

      {withDistance.length === 0 && (
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-12 text-center">
          <p className="text-3xl mb-3">🔍</p>
          <p className="font-semibold text-[var(--color-foreground)]">Aucun prestataire trouvé</p>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Essayez d'autres filtres.</p>
        </div>
      )}

      {/* Gold */}
      {gold.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-500 font-bold text-sm">⭐ Gold — Mis en avant</span>
            {hasGeo && <span className="text-xs text-[var(--color-muted-foreground)]">· Par distance</span>}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {gold.map((p) => <PrestataireCard key={p.id} p={p} badge="gold" />)}
          </div>
        </section>
      )}

      {/* Pro */}
      {pro.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[var(--color-primary)] font-bold text-sm">💜 Pro</span>
            {hasGeo && <span className="text-xs text-[var(--color-muted-foreground)]">· Par distance</span>}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pro.map((p) => <PrestataireCard key={p.id} p={p} badge="pro" />)}
          </div>
        </section>
      )}

      {/* Free */}
      {free.length > 0 && (
        <section>
          {(gold.length > 0 || pro.length > 0) && (
            <h2 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-3">
              Autres prestataires
            </h2>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {free.map((p) => <PrestataireCard key={p.id} p={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}

type CardPrestataire = Awaited<ReturnType<typeof prisma.prestataire.findMany>>[number] & {
  services: { price: number; name: string; duration: number }[];
  subscription: { plan: string } | null;
  _count: { reviews: number };
  distanceKm: number | null;
};

function PrestataireCard({ p, badge }: { p: CardPrestataire; badge?: "gold" | "pro" }) {
  const minPrice = p.services.length > 0 ? Math.min(...p.services.map((s) => s.price)) : null;

  return (
    <Link
      href={`/prestataires/${p.slug}`}
      className={`block bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all ${
        badge === "gold" ? "border-amber-300 ring-1 ring-amber-200"
        : badge === "pro" ? "border-[var(--color-primary)]/30"
        : "border-[var(--color-border)]"
      }`}
    >
      {/* Cover */}
      <div className="h-36 relative flex items-center justify-center overflow-hidden">
        {p.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.coverImage} alt={p.businessName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full jam-gradient flex items-center justify-center">
            <span className="font-display font-medium text-4xl text-white/70 select-none tracking-tight">
              {p.businessName.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        {/* Badge plan */}
        {badge === "gold" && (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-900 shadow-sm badge-gold-shimmer">
            ✦ Gold
          </span>
        )}
        {badge === "pro" && (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--color-primary)] text-white shadow-sm">
            💜 Pro
          </span>
        )}

        {/* Distance chip */}
        {p.distanceKm !== null && (
          <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/50 text-white backdrop-blur-sm">
            📍 {formatDistance(p.distanceKm)}
          </span>
        )}

        {/* Ville (sans géoloc) */}
        {p.distanceKm === null && p.city && (
          <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-medium bg-black/40 text-white backdrop-blur-sm">
            📍 {p.city}
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-semibold text-[var(--color-foreground)] truncate">{p.businessName}</p>
          {p.rating > 0 && (
            <span className="shrink-0 text-sm font-medium text-amber-600">
              ★ {p.rating.toFixed(1)}
              <span className="text-xs text-[var(--color-muted-foreground)] ml-0.5">({p._count.reviews})</span>
            </span>
          )}
        </div>

        {p.description && (
          <p className="text-sm text-[var(--color-muted-foreground)] line-clamp-2 mb-3">{p.description}</p>
        )}

        {p.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {p.services.slice(0, 2).map((s) => (
              <span key={s.name} className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-cream)] text-[var(--color-muted-foreground)]">
                {s.name}
              </span>
            ))}
            {p.services.length > 2 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-cream)] text-[var(--color-muted-foreground)]">
                +{p.services.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          {minPrice !== null ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              À partir de{" "}
              <span className="font-bold text-[var(--color-foreground)]">
                {minPrice.toLocaleString("fr-FR")} FCFA
              </span>
            </p>
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">Prix sur demande</p>
          )}
          <span className="text-xs font-medium text-[var(--color-primary)]">Réserver →</span>
        </div>
      </div>
    </Link>
  );
}
