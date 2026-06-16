import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logOut } from "@/lib/actions/auth";

const NAV_ITEMS = [
  { href: "/prestataire/dashboard", label: "Tableau de bord", icon: "📊" },
  { href: "/prestataire/services", label: "Mes services", icon: "✂️" },
  { href: "/prestataire/agenda", label: "Agenda", icon: "📅" },
  { href: "/prestataire/profil", label: "Mon profil", icon: "🏪" },
  { href: "/prestataire/abonnement", label: "Abonnement", icon: "⭐" },
];


export default async function PrestataireLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "PRESTATAIRE") redirect("/connexion");

  return (
    <div className="min-h-screen flex bg-[var(--color-cream)]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-[var(--color-card)] border-r border-[var(--color-border)] py-6 px-4">
        <Link href="/" className="mb-8 px-2">
          <Image src="/jam-logo-primary.svg" alt="Jam" width={90} height={34} />
        </Link>
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
        <div className="border-t border-[var(--color-border)] pt-4 mt-4 space-y-2">
          <p className="px-3 text-xs font-medium text-[var(--color-muted-foreground)] truncate">
            {session.user.name ?? session.user.email}
          </p>
          <form action={logOut}>
            <button type="submit" className="w-full px-3 py-2 rounded-xl text-xs font-medium text-left text-[var(--color-muted-foreground)] hover:bg-red-50 hover:text-red-600 transition-colors">
              🚪 Se déconnecter
            </button>
          </form>
        </div>
      </aside>
      {/* Content */}
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

      {/* Navbar mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[var(--color-card)] border-t border-[var(--color-border)] flex justify-around py-2 z-50">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}
            className="flex flex-col items-center gap-0.5 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] px-2">
            <span className="text-lg">{item.icon}</span>
            <span className="truncate max-w-[60px] text-center">{item.label.split(" ")[0]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
