import { prisma } from "@/lib/prisma";

export default async function EnrollmentsPage() {
  const pending = await prisma.prestataire.findMany({
    where: { enrollmentStatus: { in: ["PENDING", "IN_REVIEW"] } },
    include: { user: true, enrollmentDocs: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold mb-6">Dossiers d'enrollment</h1>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
        {pending.length} dossier(s) en attente
      </p>
      <div className="flex flex-col gap-3">
        {pending.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-[var(--color-border)] p-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--color-foreground)]">{p.businessName}</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">{p.user.email}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              p.enrollmentStatus === "PENDING"
                ? "bg-amber-100 text-amber-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {p.enrollmentStatus}
            </span>
          </div>
        ))}
        {pending.length === 0 && (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-8 text-center text-[var(--color-muted-foreground)]">
            Aucun dossier en attente
          </div>
        )}
      </div>
    </div>
  );
}
