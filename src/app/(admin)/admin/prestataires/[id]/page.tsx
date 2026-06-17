import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { formatFCFA } from "@/lib/utils";
import Link from "next/link";
import PrestataireActions from "../PrestataireActions";

const JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default async function AdminFichePrestatairePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/connexion");

  const p = await prisma.prestataire.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true, createdAt: true, phone: true } },
      services: {
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      availabilities: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
      subscription: {
        include: { payments: { orderBy: { paidAt: "desc" }, take: 5 } },
      },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: { select: { bookings: true, reviews: true } },
    },
  });

  if (!p) notFound();

  const isSuspended = !!p.suspendedAt;
  const plan = p.subscription?.plan ?? "FREE";
  const planColor =
    plan === "GOLD"
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : plan === "PRO"
      ? "bg-purple-100 text-purple-700 border-purple-200"
      : "bg-gray-100 text-gray-500 border-gray-200";

  const activeServices = p.services.filter((s) => s.status === "ACTIVE");
  const inactiveServices = p.services.filter((s) => s.status !== "ACTIVE");

  return (
    <div className="space-y-6 pb-12">
      {/* Retour */}
      <Link
        href="/admin/prestataires"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
      >
        ← Retour à la liste
      </Link>

      {/* ── En-tête ── */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
        {/* Cover */}
        <div className="h-40 relative overflow-hidden">
          {p.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.coverImage} alt={p.businessName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full jam-gradient flex items-center justify-center">
              <span className="font-display font-medium text-6xl text-white/60 select-none tracking-tight">
                {p.businessName.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-3 right-3 flex gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${planColor}`}>
              {plan}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isSuspended
                ? "bg-red-100 text-red-700 border-red-200"
                : "bg-emerald-100 text-emerald-700 border-emerald-200"
            }`}>
              {isSuspended ? "Suspendu" : "Actif"}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">
                {p.businessName}
              </h1>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
                Inscrit le {new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              {p.rating > 0 && (
                <p className="text-sm mt-1">
                  <span className="text-amber-500 font-medium">★ {p.rating.toFixed(1)}</span>
                  <span className="text-[var(--color-muted-foreground)] ml-1">({p._count.reviews} avis)</span>
                </p>
              )}
            </div>
            {/* Lien profil public */}
            <a
              href={`/prestataires/${p.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-4 py-2 rounded-full text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-cream)] transition-colors"
            >
              Voir profil public ↗
            </a>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Colonne gauche (2/3) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Informations générales */}
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
            <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-4">Informations générales</h2>
            <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)] mb-0.5">NIU</dt>
                <dd className="text-[var(--color-foreground)] font-medium">{p.niu ?? <span className="text-red-500 italic">Non renseigné</span>}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)] mb-0.5">Email</dt>
                <dd>{p.user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)] mb-0.5">Téléphone</dt>
                <dd>{p.phone ?? p.user.phone ?? <span className="italic text-[var(--color-muted-foreground)]">—</span>}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)] mb-0.5">Ville</dt>
                <dd>{p.city ?? <span className="italic text-[var(--color-muted-foreground)]">—</span>}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)] mb-0.5">Adresse</dt>
                <dd>{p.address ?? <span className="italic text-[var(--color-muted-foreground)]">—</span>}</dd>
              </div>
              {(p.latitude || p.longitude) && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)] mb-0.5">Coordonnées GPS</dt>
                  <dd className="font-mono text-xs">{p.latitude}, {p.longitude}</dd>
                </div>
              )}
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)] mb-0.5">Description</dt>
                <dd className="leading-relaxed text-[var(--color-muted-foreground)]">
                  {p.description ?? <span className="italic">Aucune description.</span>}
                </dd>
              </div>
            </dl>
          </div>

          {/* Services */}
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[var(--color-foreground)]">
                Services ({p.services.length})
              </h2>
              <div className="flex gap-3 text-xs text-[var(--color-muted-foreground)]">
                <span className="text-emerald-600">{activeServices.length} actifs</span>
                {inactiveServices.length > 0 && <span className="text-gray-400">{inactiveServices.length} inactifs</span>}
              </div>
            </div>

            {p.services.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)] italic">Aucun service.</p>
            ) : (
              <div className="space-y-3">
                {p.services.map((s) => (
                  <div key={s.id} className="flex gap-4 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-cream)]">
                    {/* Photos */}
                    {s.photos.length > 0 ? (
                      <div className="flex gap-1 shrink-0">
                        {s.photos.slice(0, 2).map((photo, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={photo} alt="" className="w-14 h-14 rounded-lg object-cover" />
                        ))}
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-[var(--color-muted)] shrink-0 flex items-center justify-center text-xl opacity-30">
                        📷
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm text-[var(--color-foreground)]">{s.name}</p>
                          {s.category && (
                            <span className="text-xs text-[var(--color-muted-foreground)] bg-white px-2 py-0.5 rounded-full border border-[var(--color-border)] mt-0.5 inline-block">
                              {s.category.name}
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm text-[var(--color-foreground)]">{formatFCFA(s.price)}</p>
                          <p className="text-xs text-[var(--color-muted-foreground)]">{s.duration} min</p>
                        </div>
                      </div>
                      {s.description && (
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-1 line-clamp-2">{s.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          s.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {s.status === "ACTIVE" ? "Actif" : "Inactif"}
                        </span>
                        <span className="text-xs text-[var(--color-muted-foreground)]">
                          {s.photos.length} photo{s.photos.length > 1 ? "s" : ""}
                        </span>
                        {s.videoUrl && <span className="text-xs text-blue-500">🎬 Vidéo</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Horaires */}
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
            <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-4">
              Horaires ({p.availabilities.length} jour{p.availabilities.length > 1 ? "s" : ""})
            </h2>
            {p.availabilities.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)] italic">Aucun horaire renseigné.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {p.availabilities.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--color-cream)] border border-[var(--color-border)] text-sm">
                    <span className="font-medium text-[var(--color-foreground)] w-10">{JOURS[a.dayOfWeek]}</span>
                    <span className="text-[var(--color-muted-foreground)]">{a.startTime} → {a.endTime}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Avis récents */}
          {p.reviews.length > 0 && (
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
              <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-4">
                Avis récents ({p._count.reviews} total)
              </h2>
              <div className="space-y-3">
                {p.reviews.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-[var(--color-cream)] border border-[var(--color-border)]">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-[var(--color-foreground)]">{r.user.name}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-amber-400 text-sm">{"★".repeat(r.rating)}</span>
                        <span className="text-xs text-[var(--color-muted-foreground)]">{r.rating}/5</span>
                      </div>
                    </div>
                    {r.comment && <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">{r.comment}</p>}
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                      {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Colonne droite (1/3) ── */}
        <div className="space-y-6">

          {/* Statistiques */}
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
            <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-4">Statistiques</h2>
            <div className="space-y-3">
              {[
                { label: "Réservations", value: p._count.bookings },
                { label: "Avis clients", value: p._count.reviews },
                { label: "Note moyenne", value: p.rating > 0 ? `★ ${p.rating.toFixed(1)}` : "—" },
                { label: "Services actifs", value: activeServices.length },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
                  <span className="text-sm text-[var(--color-muted-foreground)]">{stat.label}</span>
                  <span className="text-sm font-semibold text-[var(--color-foreground)]">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Abonnement */}
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
            <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-4">Abonnement</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-muted-foreground)]">Plan actuel</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${planColor}`}>{plan}</span>
              </div>
              {p.subscription && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-muted-foreground)]">Réservations/mois</span>
                    <span className="font-medium">{p.subscription.monthlyCount}</span>
                  </div>
                  {p.subscription.endDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-muted-foreground)]">Fin de période</span>
                      <span className="font-medium">{new Date(p.subscription.endDate).toLocaleDateString("fr-FR")}</span>
                    </div>
                  )}
                  {p.subscription.payments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                      <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide mb-2">Derniers paiements</p>
                      {p.subscription.payments.map((pay) => (
                        <div key={pay.id} className="flex items-center justify-between py-1 text-xs">
                          <span className="text-[var(--color-muted-foreground)]">{new Date(pay.paidAt).toLocaleDateString("fr-FR")}</span>
                          <span className="font-medium">{formatFCFA(pay.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Suspension */}
          {isSuspended && (
            <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
              <h2 className="text-base font-semibold text-red-700 mb-3">Compte suspendu</h2>
              <p className="text-xs text-red-600 mb-1">
                Depuis le {new Date(p.suspendedAt!).toLocaleDateString("fr-FR")}
              </p>
              {p.suspendedReason && (
                <p className="text-sm text-red-700 leading-relaxed">
                  <strong>Motif :</strong> {p.suspendedReason}
                </p>
              )}
            </div>
          )}

          {/* Actions admin */}
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
            <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-4">Actions</h2>
            <PrestataireActions
              prestataireId={p.id}
              userId={p.userId}
              isSuspended={isSuspended}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
