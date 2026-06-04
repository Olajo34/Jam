import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { updateProfile, logOut } from "@/lib/actions/auth";
import Link from "next/link";

export default async function ProfilPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: { select: { bookings: true, reviews: true } },
    },
  });
  if (!user) redirect("/connexion");

  const ROLE_LABELS: Record<string, string> = {
    USER: "Client",
    PRESTATAIRE: "Prestataire",
    MODERATEUR: "Modérateur",
    ADMIN: "Administrateur",
  };

  return (
    <div className="max-w-lg space-y-6 pb-20 sm:pb-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Mon profil</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">Gérez vos informations personnelles.</p>
      </div>

      {/* Avatar + stats */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl jam-gradient flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {user.name?.[0]?.toUpperCase() ?? "U"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--color-foreground)] truncate">{user.name}</p>
          <p className="text-sm text-[var(--color-muted-foreground)] truncate">{user.email}</p>
          <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-cream)] text-[var(--color-foreground)]">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        </div>
        <div className="text-center shrink-0">
          <p className="text-2xl font-display font-bold text-[var(--color-foreground)]">{user._count.bookings}</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">réservation{user._count.bookings > 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
        <h2 className="font-semibold text-[var(--color-foreground)] mb-5">Modifier mes informations</h2>
        <form action={updateProfile} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-foreground)]">Nom complet</label>
            <input
              name="name"
              defaultValue={user.name ?? ""}
              required
              minLength={2}
              className="input-base"
              placeholder="Votre nom"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-foreground)]">Téléphone</label>
            <input
              name="phone"
              defaultValue={user.phone ?? ""}
              type="tel"
              className="input-base"
              placeholder="+225 07 00 00 00"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-foreground)]">Email</label>
            <input
              value={user.email ?? ""}
              readOnly
              className="input-base bg-[var(--color-cream)] cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-full font-medium text-sm text-white jam-gradient hover:opacity-90 transition-opacity"
          >
            Enregistrer les modifications
          </button>
        </form>
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
        <Link
          href="/reservations"
          className="flex items-center justify-between px-5 py-4 hover:bg-[var(--color-cream)] transition-colors"
        >
          <span className="text-sm font-medium text-[var(--color-foreground)]">📅 Mes réservations</span>
          <span className="text-[var(--color-muted-foreground)]">→</span>
        </Link>
        <Link
          href="/recherche"
          className="flex items-center justify-between px-5 py-4 hover:bg-[var(--color-cream)] transition-colors"
        >
          <span className="text-sm font-medium text-[var(--color-foreground)]">🔍 Explorer les prestataires</span>
          <span className="text-[var(--color-muted-foreground)]">→</span>
        </Link>
      </div>

      {/* Logout */}
      <form action={logOut}>
        <button
          type="submit"
          className="w-full py-3 rounded-full text-sm font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
        >
          Se déconnecter
        </button>
      </form>

      <p className="text-xs text-center text-[var(--color-muted-foreground)]">
        Membre depuis le {user.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
      </p>
    </div>
  );
}
