import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PrestataireActions from "./PrestataireActions";

const CRITERIA = [
  { key: "description", label: "Description" },
  { key: "phone", label: "Téléphone" },
  { key: "address", label: "Adresse" },
  { key: "city", label: "Ville" },
  { key: "coverImage", label: "Photo" },
  { key: "services", label: "Services" },
  { key: "availabilities", label: "Horaires" },
] as const;

function score(p: {
  description: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  coverImage: string | null;
  _count: { services: number; availabilities: number };
}) {
  const checks = {
    description: !!p.description && p.description.length > 10,
    phone: !!p.phone,
    address: !!p.address,
    city: !!p.city,
    coverImage: !!p.coverImage,
    services: p._count.services > 0,
    availabilities: p._count.availabilities > 0,
  };
  const total = Object.values(checks).filter(Boolean).length;
  const missing = CRITERIA.filter((c) => !checks[c.key]).map((c) => c.label);
  return { total, pct: Math.round((total / 7) * 100), missing };
}

export default async function PrestataireConformitePage({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string; q?: string }>;
}) {
  const { filtre, q } = await searchParams;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/connexion");

  const prestataires = await prisma.prestataire.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, name: true } },
      subscription: { select: { plan: true } },
      _count: { select: { services: true, availabilities: true, bookings: true } },
    },
  });

  const filtered = prestataires.filter((p) => {
    const s = score(p);
    if (q) {
      const term = q.toLowerCase();
      if (
        !p.businessName.toLowerCase().includes(term) &&
        !p.user.email.toLowerCase().includes(term)
      )
        return false;
    }
    if (filtre === "complet") return s.total === 7 && !p.suspendedAt;
    if (filtre === "incomplet") return s.total < 7 && !p.suspendedAt;
    if (filtre === "suspendu") return !!p.suspendedAt;
    if (filtre === "relance") return !!p.lastReminderAt;
    return true;
  });

  const counts = {
    tous: prestataires.length,
    complet: prestataires.filter((p) => score(p).total === 7 && !p.suspendedAt).length,
    incomplet: prestataires.filter((p) => score(p).total < 7 && !p.suspendedAt).length,
    suspendu: prestataires.filter((p) => !!p.suspendedAt).length,
    relance: prestataires.filter((p) => !!p.lastReminderAt).length,
  };

  const FILTERS = [
    { key: "", label: `Tous (${counts.tous})` },
    { key: "incomplet", label: `Incomplets (${counts.incomplet})`, color: "text-amber-600" },
    { key: "suspendu", label: `Suspendus (${counts.suspendu})`, color: "text-red-600" },
    { key: "complet", label: `Conformes (${counts.complet})`, color: "text-emerald-600" },
    { key: "relance", label: `Relancés (${counts.relance})`, color: "text-blue-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">
          Conformité prestataires
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
          Contrôle des profils, relances, suspensions et résiliations.
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 items-center">
        <form method="GET" className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher..."
            className="px-4 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-52"
          />
          {filtre && <input type="hidden" name="filtre" value={filtre} />}
          <button type="submit" className="px-4 py-2 text-sm rounded-xl bg-[var(--color-primary)] text-white hover:opacity-90">
            Chercher
          </button>
        </form>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <a
              key={f.key}
              href={`/admin/prestataires?filtre=${f.key}${q ? `&q=${q}` : ""}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                (filtre ?? "") === f.key
                  ? "bg-[var(--color-foreground)] text-white border-[var(--color-foreground)]"
                  : `bg-white border-[var(--color-border)] hover:bg-[var(--color-cream)] ${f.color ?? ""}`
              }`}
            >
              {f.label}
            </a>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-[var(--color-muted-foreground)] text-sm">
            Aucun prestataire trouvé.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-cream)]">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">Prestataire</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">Conformité</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">Plan</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">Activité</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">Statut</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide min-w-[220px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filtered.map((p) => {
                  const s = score(p);
                  const isSuspended = !!p.suspendedAt;
                  const plan = p.subscription?.plan ?? "FREE";
                  const planColor =
                    plan === "GOLD"
                      ? "bg-amber-100 text-amber-700"
                      : plan === "PRO"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-500";

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${isSuspended ? "bg-red-50/40" : "hover:bg-[var(--color-cream)]/40"}`}
                    >
                      {/* Identité */}
                      <td className="px-5 py-4">
                        <p className="font-medium text-[var(--color-foreground)]">{p.businessName}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">{p.user.email}</p>
                        {p.lastReminderAt && (
                          <p className="text-xs text-blue-500 mt-0.5">
                            Relancé le {new Date(p.lastReminderAt).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </td>

                      {/* Score conformité */}
                      <td className="px-5 py-4 min-w-[180px]">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex-1 h-1.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                s.pct === 100
                                  ? "bg-emerald-500"
                                  : s.pct >= 60
                                  ? "bg-amber-400"
                                  : "bg-red-400"
                              }`}
                              style={{ width: `${s.pct}%` }}
                            />
                          </div>
                          <span
                            className={`text-xs font-semibold ${
                              s.pct === 100
                                ? "text-emerald-600"
                                : s.pct >= 60
                                ? "text-amber-600"
                                : "text-red-600"
                            }`}
                          >
                            {s.total}/7
                          </span>
                        </div>
                        {s.missing.length > 0 && (
                          <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
                            Manque : {s.missing.join(", ")}
                          </p>
                        )}
                      </td>

                      {/* Plan */}
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColor}`}>
                          {plan}
                        </span>
                      </td>

                      {/* Activité */}
                      <td className="px-5 py-4 text-[var(--color-muted-foreground)]">
                        <p>{p._count.services} service{p._count.services > 1 ? "s" : ""}</p>
                        <p>{p._count.bookings} résa</p>
                      </td>

                      {/* Statut */}
                      <td className="px-5 py-4">
                        {isSuspended ? (
                          <div>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              Suspendu
                            </span>
                            {p.suspendedReason && (
                              <p className="text-xs text-[var(--color-muted-foreground)] mt-1 max-w-[120px] leading-relaxed">
                                {p.suspendedReason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            Actif
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <PrestataireActions
                          prestataireId={p.id}
                          userId={p.user.id}
                          isSuspended={isSuspended}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
