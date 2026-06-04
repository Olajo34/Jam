import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const NAV_ITEMS = [
  { href: "/prestataire/dashboard", label: "Tableau de bord", icon: "📊" },
  { href: "/prestataire/services", label: "Mes services", icon: "✂️" },
  { href: "/prestataire/agenda", label: "Agenda", icon: "📅" },
  { href: "/prestataire/abonnement", label: "Abonnement", icon: "⭐" },
];


export default async function PrestataireLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "PRESTATAIRE") redirect("/connexion");

  return (
    <div className="min-h-screen flex bg-[var(--color-cream)]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-white border-r border-[var(--color-border)] py-6 px-4">
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
        <div className="border-t border-[var(--color-border)] pt-4 mt-4">
          <p className="px-3 text-xs font-medium text-[var(--color-muted-foreground)] truncate">
            {session.user.email}
          </p>
        </div>
      </aside>
      {/* Content */}
      <main className="flex-1 flex flex-col">
        <div className="p-6 md:p-8 flex-1">{children}</div>
      </main>
    </div>
  );
}
