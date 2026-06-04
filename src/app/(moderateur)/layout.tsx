import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logOut } from "@/lib/actions/auth";

const NAV_ITEMS = [
  { href: "/moderateur/dashboard", label: "Vue d'ensemble", icon: "📊" },
  { href: "/moderateur/tickets", label: "Tickets clients", icon: "🎫" },
  { href: "/moderateur/enrollments", label: "Dossiers prestataires", icon: "📋" },
];

export default async function ModerateurLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || !["MODERATEUR", "ADMIN"].includes(session.user.role)) redirect("/connexion");

  return (
    <div className="min-h-screen flex bg-[var(--color-cream)]">
      <aside className="w-60 flex flex-col bg-white border-r border-[var(--color-border)] py-6 px-4">
        <Link href="/" className="mb-8 px-2">
          <Image src="/jam-logo-primary.svg" alt="Jam" width={90} height={34} />
        </Link>
        <p className="px-3 mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)]">
          Modération
        </p>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-cream)] hover:text-[var(--color-foreground)] transition-colors"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-[var(--color-border)] pt-4 space-y-2">
          <p className="px-3 text-xs text-[var(--color-muted-foreground)] truncate">{session.user.email}</p>
          <form action={logOut}>
            <button type="submit" className="w-full px-3 py-2 rounded-xl text-xs font-medium text-left text-[var(--color-muted-foreground)] hover:bg-red-50 hover:text-red-600 transition-colors">
              🚪 Se déconnecter
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
