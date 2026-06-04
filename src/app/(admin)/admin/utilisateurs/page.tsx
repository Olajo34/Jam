import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deleteUser, changeUserRole } from "@/lib/actions/admin";
import type { Role } from "@prisma/client";

const ROLE_LABELS: Record<Role, string> = {
  USER: "Utilisateur",
  PRESTATAIRE: "Prestataire",
  MODERATEUR: "Modérateur",
  ADMIN: "Admin",
};

const ROLE_COLORS: Record<Role, string> = {
  USER: "bg-gray-100 text-gray-600",
  PRESTATAIRE: "bg-purple-100 text-purple-700",
  MODERATEUR: "bg-blue-100 text-blue-700",
  ADMIN: "bg-red-100 text-red-700",
};

export default async function UtilisateursPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string; page?: string }>;
}) {
  const { role, q, page } = await searchParams;
  const pageNum = Math.max(1, Number(page ?? 1));
  const perPage = 20;

  const where = {
    ...(role && Object.keys(ROLE_LABELS).includes(role) ? { role: role as Role } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }] } : {}),
  };

  const session = await auth();
  const currentUserId = session?.user.id;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: perPage,
      skip: (pageNum - 1) * perPage,
      include: {
        prestataire: { select: { businessName: true, enrollmentStatus: true } },
        _count: { select: { bookings: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Utilisateurs</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">{total.toLocaleString("fr-FR")} membres inscrits</p>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher nom, email..."
          className="px-4 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-64"
        />
        <select
          name="role"
          defaultValue={role ?? ""}
          className="px-4 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="">Tous les rôles</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 text-sm rounded-xl bg-[var(--color-primary)] text-white hover:opacity-90"
        >
          Filtrer
        </button>
        {(q || role) && (
          <a href="/admin/utilisateurs" className="px-4 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white hover:bg-[var(--color-cream)]">
            Effacer
          </a>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-cream)]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">Membre</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">Rôle</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">Activité</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">Inscrit le</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[var(--color-muted-foreground)]">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            )}
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const isAdmin = u.role === "ADMIN";
              const canDelete = !isSelf && !isAdmin;
              return (
                <tr key={u.id} className="hover:bg-[var(--color-cream)]/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full jam-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(u.name ?? u.email)[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--color-foreground)] truncate">
                          {u.name ?? "—"}
                          {isSelf && <span className="ml-1.5 text-xs text-[var(--color-primary)]">(vous)</span>}
                        </p>
                        <p className="text-xs text-[var(--color-muted-foreground)] truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {!isSelf && !isAdmin ? (
                      <form action={changeUserRole.bind(null, u.id)} className="flex items-center gap-1">
                        <select
                          name="newRole"
                          defaultValue={u.role}
                          className="text-xs px-2 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] focus:outline-none cursor-pointer"
                        >
                          {Object.entries(ROLE_LABELS).filter(([k]) => k !== "ADMIN").map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <button type="submit" className="text-xs text-[var(--color-primary)] hover:underline px-1">✓</button>
                      </form>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    )}
                    {u.prestataire && (
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 truncate max-w-32">
                        {u.prestataire.businessName}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[var(--color-muted-foreground)]">
                    {u._count.bookings > 0 ? (
                      <span>{u._count.bookings} réservation{u._count.bookings > 1 ? "s" : ""}</span>
                    ) : (
                      <span className="text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[var(--color-muted-foreground)]">
                    {u.createdAt.toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-3">
                    {canDelete ? (
                      <form action={deleteUser.bind(null, u.id)}>
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
                        >
                          Supprimer
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-[var(--color-muted-foreground)]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-[var(--color-muted-foreground)]">
            Page {pageNum} / {totalPages}
          </p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <a
                href={`/admin/utilisateurs?${new URLSearchParams({ ...(q ? { q } : {}), ...(role ? { role } : {}), page: String(pageNum - 1) })}`}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] bg-white hover:bg-[var(--color-cream)]"
              >
                ← Précédent
              </a>
            )}
            {pageNum < totalPages && (
              <a
                href={`/admin/utilisateurs?${new URLSearchParams({ ...(q ? { q } : {}), ...(role ? { role } : {}), page: String(pageNum + 1) })}`}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] bg-white hover:bg-[var(--color-cream)]"
              >
                Suivant →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
