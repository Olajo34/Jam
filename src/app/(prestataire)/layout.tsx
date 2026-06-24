import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logOut } from "@/lib/actions/auth";
import { LayoutDashboard, Scissors, CalendarDays, Store, Star, LogOut, PauseCircle } from "lucide-react";

const NAV_ITEMS = [
  { href: "/prestataire/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/prestataire/services", label: "Mes services", icon: Scissors },
  { href: "/prestataire/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/prestataire/profil", label: "Mon profil", icon: Store },
  { href: "/prestataire/abonnement", label: "Abonnement", icon: Star },
];

export default async function PrestataireLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "PRESTATAIRE") redirect("/connexion");

  const prestataire = await import("@/lib/prisma").then(({ prisma }) =>
    prisma.prestataire.findUnique({
      where: { userId: session.user.id },
      select: { suspendedAt: true, suspendedReason: true },
    })
  );

  if (prestataire?.suspendedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <PauseCircle size={26} className="text-red-500" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-display font-semibold text-[var(--color-foreground)] mb-2">
            Compte suspendu
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
            Votre compte prestataire a été temporairement suspendu par l&apos;équipe Jam.
          </p>
          {prestataire.suspendedReason && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 mb-4 text-left">
              <p className="text-xs font-semibold text-red-700 mb-1">Motif</p>
              <p className="text-sm text-red-800">{prestataire.suspendedReason}</p>
            </div>
          )}
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Contactez-nous à <a href="mailto:support@jamfeeling.com" className="underline">support@jamfeeling.com</a> pour régulariser votre situation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[var(--color-cream)]">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex w-60 flex-col bg-[var(--color-card)] border-r border-[var(--color-border)] py-6 px-4">
        <Link href="/" className="mb-8 px-2">
          <Image src="/jam-logo-primary.svg" alt="Jam" width={90} height={34} />
        </Link>
        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-cream)] hover:text-[var(--color-foreground)] transition-colors cursor-pointer"
            >
              <Icon size={16} strokeWidth={1.5} className="shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-[var(--color-border)] pt-4 mt-4 space-y-2">
          <p className="px-3 text-xs font-medium text-[var(--color-muted-foreground)] truncate">
            {session.user.name ?? session.user.email}
          </p>
          <form action={logOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[var(--color-muted-foreground)] hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut size={13} strokeWidth={2} />
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Header mobile */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--color-card)] border-b border-[var(--color-border)]">
          <Link href="/">
            <Image src="/jam-logo-primary.svg" alt="Jam" width={70} height={26} />
          </Link>
          <p className="text-xs text-[var(--color-muted-foreground)] truncate max-w-[180px]">{session.user.name}</p>
        </div>
        <div className="p-4 md:p-8 flex-1 pb-24 md:pb-8">{children}</div>
      </main>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[var(--color-card)]/95 backdrop-blur border-t border-[var(--color-border)] flex justify-around items-center py-2 z-50">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 py-1 px-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors"
          >
            <Icon size={20} strokeWidth={1.5} />
            <span className="text-[10px] font-medium truncate max-w-[56px] text-center">{label.split(" ")[0]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
