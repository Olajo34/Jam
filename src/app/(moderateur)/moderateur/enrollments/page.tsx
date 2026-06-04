import { prisma } from "@/lib/prisma";
import { approveEnrollment, rejectEnrollment, setInReview } from "@/lib/actions/enrollment";

const STATUS_CONFIG = {
  PENDING: { label: "En attente", color: "bg-amber-100 text-amber-700" },
  IN_REVIEW: { label: "En examen", color: "bg-blue-100 text-blue-700" },
  APPROVED: { label: "Approuvé", color: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Rejeté", color: "bg-red-100 text-red-700" },
};

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const pendingStatuses: Array<"PENDING" | "IN_REVIEW"> = ["PENDING", "IN_REVIEW"];
  const where = status
    ? { enrollmentStatus: status as keyof typeof STATUS_CONFIG }
    : { enrollmentStatus: { in: pendingStatuses } };

  const [prestataires, counts] = await Promise.all([
    prisma.prestataire.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, phone: true, createdAt: true } },
        enrollmentDocs: true,
        services: { select: { id: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.prestataire.groupBy({
      by: ["enrollmentStatus"],
      _count: true,
    }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.enrollmentStatus, c._count]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Dossiers prestataires</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">Validation des demandes d'enrollment</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "", label: "En cours", count: (countMap["PENDING"] ?? 0) + (countMap["IN_REVIEW"] ?? 0) },
          { key: "PENDING", label: "En attente", count: countMap["PENDING"] ?? 0 },
          { key: "IN_REVIEW", label: "En examen", count: countMap["IN_REVIEW"] ?? 0 },
          { key: "APPROVED", label: "Approuvés", count: countMap["APPROVED"] ?? 0 },
          { key: "REJECTED", label: "Rejetés", count: countMap["REJECTED"] ?? 0 },
        ].map((tab) => (
          <a
            key={tab.key}
            href={tab.key ? `/moderateur/enrollments?status=${tab.key}` : "/moderateur/enrollments"}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              (status ?? "") === tab.key
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-cream)]"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 text-xs ${(status ?? "") === tab.key ? "opacity-80" : "text-[var(--color-primary)] font-bold"}`}>
                {tab.count}
              </span>
            )}
          </a>
        ))}
      </div>

      {/* Dossiers */}
      <div className="space-y-4">
        {prestataires.length === 0 && (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-12 text-center text-[var(--color-muted-foreground)]">
            Aucun dossier dans cette catégorie
          </div>
        )}
        {prestataires.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl jam-gradient flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {p.businessName[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-foreground)]">{p.businessName}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {p.user.email} · {p.city ?? "Ville non renseignée"}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[p.enrollmentStatus as keyof typeof STATUS_CONFIG]?.color}`}>
                {STATUS_CONFIG[p.enrollmentStatus as keyof typeof STATUS_CONFIG]?.label ?? p.enrollmentStatus}
              </span>
            </div>

            {/* Details */}
            <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-[var(--color-cream)]/40">
              <Detail label="Téléphone" value={p.phone ?? p.user.phone ?? "—"} />
              <Detail label="Adresse" value={p.address ?? "—"} />
              <Detail label="Services créés" value={`${p.services.length}`} />
              <Detail label="Documents" value={`${p.enrollmentDocs.length} fichier(s)`} />
            </div>

            {p.description && (
              <div className="px-6 py-3 border-t border-[var(--color-border)]">
                <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1">Description</p>
                <p className="text-sm text-[var(--color-foreground)] line-clamp-2">{p.description}</p>
              </div>
            )}

            {/* Documents */}
            {p.enrollmentDocs.length > 0 && (
              <div className="px-6 py-3 border-t border-[var(--color-border)]">
                <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-2">Documents fournis</p>
                <div className="flex flex-wrap gap-2">
                  {p.enrollmentDocs.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-white text-xs hover:bg-[var(--color-cream)] transition-colors"
                    >
                      📄 {doc.docType}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {["PENDING", "IN_REVIEW"].includes(p.enrollmentStatus) && (
              <div className="px-6 py-4 border-t border-[var(--color-border)] flex flex-wrap items-center gap-3">
                {p.enrollmentStatus === "PENDING" && (
                  <form action={setInReview.bind(null, p.id)}>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl border border-blue-300 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      🔍 Mettre en examen
                    </button>
                  </form>
                )}
                <form action={approveEnrollment.bind(null, p.id)}>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    ✓ Approuver
                  </button>
                </form>
                <form action={async (formData: FormData) => {
                  "use server";
                  await rejectEnrollment(p.id, formData.get("reason") as string);
                }}>
                  <div className="flex items-center gap-2">
                    <input
                      name="reason"
                      placeholder="Motif du rejet (optionnel)"
                      className="px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-red-300 w-52"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                      ✕ Rejeter
                    </button>
                  </div>
                </form>
                <p className="text-xs text-[var(--color-muted-foreground)] ml-auto">
                  Soumis le {p.createdAt.toLocaleDateString("fr-FR")}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
      <p className="font-medium text-[var(--color-foreground)] mt-0.5">{value}</p>
    </div>
  );
}
