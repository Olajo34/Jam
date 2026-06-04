import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Vue d'ensemble", icon: "📊" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "👥" },
  { href: "/admin/finances", label: "Finances", icon: "💰" },
  { href: "/admin/parametres", label: "Paramètres", icon: "⚙️" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/connexion");

  return (
    <div className="min-h-screen flex bg-[var(--color-dark)]">
      <aside className="w-64 flex flex-col bg-[#1e1018] border-r border-white/10 py-6 px-4">
        <Link href="/" className="mb-8 px-2">
          <Image src="/jam-logo-primary.svg" alt="Jam" width={90} height={34} className="brightness-0 invert" />
        </Link>
        <p className="px-3 mb-4 text-xs font-semibold uppercase tracking-widest text-white/30">Administration</p>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-4 mt-4">
          <span className="px-3 inline-flex items-center gap-1.5 text-xs font-medium text-white/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Admin · {session.user.email?.split("@")[0]}
          </span>
        </div>
      </aside>
      <main className="flex-1 bg-[var(--color-cream)]">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
