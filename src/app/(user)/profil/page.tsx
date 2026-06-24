import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { updateProfile, logOut } from "@/lib/actions/auth";
import Link from "next/link";
import AvatarUploader from "@/components/shared/AvatarUploader";
import { CalendarDays, Search, ChevronRight, LogOut } from "lucide-react";

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
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <AvatarUploader
            currentImage={user.image}
            initials={(user.name?.[0] ?? "U").toUpperCase()}
          />
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="font-semibold text-lg text-[var(--color-foreground)] truncate">{user.name}</p>
            <p className="text-sm text-[var(--color-muted-foreground)] truncate">{user.email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-cream)] text-[var(--color-foreground)]">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
            <div className="mt-3 flex justify-center sm:justify-start gap-6">
              <div className="text-center">
                <p className="text-2xl font-display font-bold text-[var(--color-foreground)]">{user._count.bookings}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">réservation{user._count.bookings > 1 ? "s" : ""}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-display font-bold text-[var(--color-foreground)]">{user._count.reviews}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">avis</p>
              </div>
            </div>
          </div>
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
            className="w-full py-2.5 rounded-full font-medium text-sm text-white jam-gradient hover:opacity-90 transition-opacity cursor-pointer"
          >
            Enregistrer les modifications
          </button>
        </form>
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] divide-y divide-[var(--color-border)] overflow-hidden">
        <Link
          href="/reservations"
          className="flex items-center gap-3 px-5 py-4 hover:bg-[var(--color-cream)] transition-colors cursor-pointer"
        >
          <CalendarDays size={16} className="text-[var(--color-muted-foreground)] shrink-0" strokeWidth={1.5} />
          <span className="text-sm font-medium text-[var(--color-foreground)] flex-1">Mes réservations</span>
          <ChevronRight size={15} className="text-[var(--color-muted-foreground)]" strokeWidth={1.5} />
        </Link>
        <Link
          href="/recherche"
          className="flex items-center gap-3 px-5 py-4 hover:bg-[var(--color-cream)] transition-colors cursor-pointer"
        >
          <Search size={16} className="text-[var(--color-muted-foreground)] shrink-0" strokeWidth={1.5} />
          <span className="text-sm font-medium text-[var(--color-foreground)] flex-1">Explorer les prestataires</span>
          <ChevronRight size={15} className="text-[var(--color-muted-foreground)]" strokeWidth={1.5} />
        </Link>
      </div>

      {/* Logout */}
      <form action={logOut}>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut size={15} strokeWidth={2} />
          Se déconnecter
        </button>
      </form>

      <p className="text-xs text-center text-[var(--color-muted-foreground)]">
        Membre depuis le {user.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
      </p>
    </div>
  );
}
