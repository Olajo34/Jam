import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgentChat } from "@/components/shared/AgentChat";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userImage = session
    ? (await prisma.user.findUnique({ where: { id: session.user.id }, select: { image: true } }))?.image
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-cream)]">
      <header className="sticky top-0 z-50 bg-[var(--color-card)]/80 backdrop-blur border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/">
            <Image src="/jam-logo-primary.svg" alt="Jam" width={80} height={30} />
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/recherche" className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
              Explorer
            </Link>
            <Link href="/reservations" className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
              Mes réservations
            </Link>
            {session ? (
              <Link href="/profil" className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ring-[var(--color-primary)]/20 hover:ring-[var(--color-primary)]/60 transition-all">
                {userImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userImage} alt="" className="w-full h-full object-cover object-center" />
                ) : (
                  <div className="w-full h-full jam-gradient flex items-center justify-center text-white text-xs font-bold">
                    {session.user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
              </Link>
            ) : (
              <Link
                href="/connexion"
                className="px-4 py-1.5 rounded-full text-sm font-medium text-white jam-gradient hover:opacity-90"
              >
                Connexion
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">{children}</main>
      {session && <AgentChat />}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-[var(--color-card)] border-t border-[var(--color-border)] flex justify-around py-2 z-50">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-xs text-[var(--color-muted-foreground)]">
          <span className="text-lg">🏠</span> Accueil
        </Link>
        <Link href="/recherche" className="flex flex-col items-center gap-0.5 text-xs text-[var(--color-muted-foreground)]">
          <span className="text-lg">🔍</span> Recherche
        </Link>
        <Link href="/reservations" className="flex flex-col items-center gap-0.5 text-xs text-[var(--color-muted-foreground)]">
          <span className="text-lg">📅</span> Réservations
        </Link>
        <Link href="/profil" className="flex flex-col items-center gap-0.5 text-xs text-[var(--color-muted-foreground)]">
          <span className="text-lg">👤</span> Profil
        </Link>
      </nav>
    </div>
  );
}
