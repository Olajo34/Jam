import { prisma } from "@/lib/prisma";
import Link from "next/link";

const STATUS_CONFIG = {
  OPEN: { label: "Ouvert", color: "bg-red-100 text-red-700" },
  IN_PROGRESS: { label: "En cours", color: "bg-amber-100 text-amber-700" },
  RESOLVED: { label: "Résolu", color: "bg-emerald-100 text-emerald-700" },
  CLOSED: { label: "Fermé", color: "bg-gray-100 text-gray-600" },
};

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const activeStatuses: Array<"OPEN" | "IN_PROGRESS"> = ["OPEN", "IN_PROGRESS"];
  const where = status
    ? { status: status as keyof typeof STATUS_CONFIG }
    : { status: { in: activeStatuses } };

  const [ticketsRaw, counts] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        messages: { select: { id: true }, orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.ticket.groupBy({ by: ["status"], _count: true }),
  ]);

  const tickets = ticketsRaw;

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Tickets clients</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">Demandes de support et réclamations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "", label: "Actifs", count: (countMap["OPEN"] ?? 0) + (countMap["IN_PROGRESS"] ?? 0) },
          { key: "OPEN", label: "Ouverts", count: countMap["OPEN"] ?? 0 },
          { key: "IN_PROGRESS", label: "En cours", count: countMap["IN_PROGRESS"] ?? 0 },
          { key: "RESOLVED", label: "Résolus", count: countMap["RESOLVED"] ?? 0 },
          { key: "CLOSED", label: "Fermés", count: countMap["CLOSED"] ?? 0 },
        ].map((tab) => (
          <a
            key={tab.key}
            href={tab.key ? `/moderateur/tickets?status=${tab.key}` : "/moderateur/tickets"}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              (status ?? "") === tab.key
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-cream)]"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 text-xs font-bold ${(status ?? "") === tab.key ? "opacity-80" : "text-[var(--color-primary)]"}`}>
                {tab.count}
              </span>
            )}
          </a>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {tickets.length === 0 && (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-12 text-center text-[var(--color-muted-foreground)]">
            Aucun ticket dans cette catégorie
          </div>
        )}
        {tickets.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/moderateur/tickets/${ticket.id}`}
            className="block bg-white rounded-2xl border border-[var(--color-border)] px-6 py-4 hover:border-[var(--color-primary)]/30 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-[var(--color-foreground)] truncate">{ticket.subject}</p>
                  {ticket.messages.length === 0 && ticket.status === "OPEN" && (
                    <span className="shrink-0 w-2 h-2 rounded-full bg-red-500" />
                  )}
                </div>
                <p className="text-sm text-[var(--color-muted-foreground)] truncate">
                  {ticket.user.name ?? ticket.user.email}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                  {ticket.messages.length} réponse(s) · {ticket.createdAt.toLocaleDateString("fr-FR")}
                </p>
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG]?.color ?? "bg-gray-100 text-gray-600"}`}>
                {STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG]?.label ?? ticket.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
