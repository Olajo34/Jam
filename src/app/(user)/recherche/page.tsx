import { prisma } from "@/lib/prisma";
import { haversineKm, formatDistance, resolveCoords, planRank } from "@/lib/utils";
import { GeolocationButton } from "@/components/shared/GeolocationButton";
import Link from "next/link";
import { Suspense } from "react";
import { MapPin, Search, Star, Sparkles, Crown } from "lucide-react";

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

  type WithDistance = (typeof prestataires)[number] & { distanceKm: number | null };

  const withDistance: WithDistance[] = prestataires.map((p) => {
    if (!hasGeo) return { ...p, distanceKm: null };
    const coords = resolveCoords(p.latitude, p.longitude, p.city);
    if (!coords) return { ...p, distanceKm: null };
    return { ...p, distanceKm: haversineKm(userLat!, userLng!, coords.lat, coords.lng) };
  });

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
      {/* Header */}
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
      <form method="GET" className="flex flex-wrap gap-2.5 items-start">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] pointer-events-none" />
          <input
            name="q" defaultValue={q}
            placeholder="Nom du prestataire..."
            className="pl-8 pr-4 py-2 text-sm rounded-full border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-48"
          />
        </div>

        {!hasGeo && (
          <select
            name="ville" defaultValue={ville ?? ""}
            className="px-4 py-2 text-sm rounded-full border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer"
          >
            <option value="">Toutes les villes</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        <select
          name="categorie" defaultValue={categorie ?? ""}
          className="px-4 py-2 text-sm rounded-full border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer"
        >
          <option value="">Toutes catégories</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>

        <button type="submit" className="px-5 py-2 rounded-full text-sm font-medium text-white jam-gradient hover:opacity-90 transition-opacity cursor-pointer">
          Rechercher
        </button>

        {(q || ville || categorie) && (
          <a href={hasGeo ? `/recherche?lat=${lat}&lng=${lng}` : "/recherche"}
            className="px-5 py-2 rounded-full text-sm border border-[var(--color-border)] bg-white hover:bg-[var(--color-cream)] transition-colors cursor-pointer">
            Effacer
          </a>
        )}

        <Suspense>
          <GeolocationButton />
        </Suspense>
      </form>

      {/* Géoloc active banner */}
      {hasGeo && (
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-sm text-[var(--color-primary)] font-medium">
          <MapPin size={14} strokeWidth={2} />
          Résultats triés par distance · Pro &amp; Gold mis en avant
        </div>
      )}

      {/* Empty state */}
      {withDistance.length === 0 && (
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-cream)] flex items-center justify-center mx-auto mb-4">
            <Search size={22} className="text-[var(--color-muted-foreground)]" strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-[var(--color-foreground)] mb-1">Aucun prestataire trouvé</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">Essayez d&apos;autres filtres ou une autre ville.</p>
        </div>
      )}

      {/* Gold section */}
      {gold.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Crown size={14} className="text-amber-500" strokeWidth={2} />
            <span className="text-amber-600 font-semibold text-sm">Gold — Mis en avant</span>
            {hasGeo && <span className="text-xs text-[var(--color-muted-foreground)]">· Par distance</span>}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {gold.map((p) => <PrestataireCard key={p.id} p={p} badge="gold" />)}
          </div>
        </section>
      )}

      {/* Pro section */}
      {pro.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-[var(--color-primary)]" strokeWidth={2} />
            <span className="text-[var(--color-primary)] font-semibold text-sm">Pro</span>
            {hasGeo && <span className="text-xs text-[var(--color-muted-foreground)]">· Par distance</span>}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pro.map((p) => <PrestataireCard key={p.id} p={p} badge="pro" />)}
          </div>
        </section>
      )}

      {/* Free section */}
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
      className={`group block bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer ${
        badge === "gold"
          ? "border-amber-300 ring-1 ring-amber-200"
          : badge === "pro"
          ? "border-[var(--color-primary)]/30"
          : "border-[var(--color-border)] hover:border-[var(--color-primary)]/20"
      }`}
    >
      {/* Cover */}
      <div className="h-40 relative flex items-center justify-center overflow-hidden bg-[var(--color-cream)]">
        {p.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.coverImage}
            alt={p.businessName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full jam-gradient flex items-center justify-center">
            <span className="font-display font-medium text-4xl text-white/70 select-none tracking-tight">
              {p.businessName.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {badge === "gold" && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-900 shadow-sm badge-gold-shimmer">
            <Crown size={10} strokeWidth={2.5} />
            Gold
          </span>
        )}
        {badge === "pro" && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--color-primary)] text-white shadow-sm">
            <Sparkles size={10} strokeWidth={2.5} />
            Pro
          </span>
        )}

        <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/50 text-white backdrop-blur-sm">
          <MapPin size={10} strokeWidth={2} />
          {p.distanceKm !== null ? formatDistance(p.distanceKm) : p.city}
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-semibold text-[var(--color-foreground)] truncate group-hover:text-[var(--color-primary)] transition-colors">
            {p.businessName}
          </p>
          {p.rating > 0 && (
            <span className="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-amber-600">
              <Star size={11} fill="currentColor" strokeWidth={0} />
              {p.rating.toFixed(1)}
              <span className="text-xs text-[var(--color-muted-foreground)] font-normal">({p._count.reviews})</span>
            </span>
          )}
        </div>

        {p.description && (
          <p className="text-sm text-[var(--color-muted-foreground)] line-clamp-2 mb-3 leading-relaxed">{p.description}</p>
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
          <span className="text-xs font-medium text-[var(--color-primary)] group-hover:underline">Voir →</span>
        </div>
      </div>
    </Link>
  );
}
