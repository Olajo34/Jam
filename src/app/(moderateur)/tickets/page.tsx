import { prisma } from "@/lib/prisma";

export default async function TicketsPage() {
  const tickets = await prisma.ticket.findMany({
    where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold mb-6">Tickets clients</h1>
      <div className="flex flex-col gap-3">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="bg-white rounded-2xl border border-[var(--color-border)] p-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--color-foreground)]">{ticket.subject}</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">{ticket.user.email}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              ticket.status === "OPEN" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
            }`}>
              {ticket.status}
            </span>
          </div>
        ))}
        {tickets.length === 0 && (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-8 text-center text-[var(--color-muted-foreground)]">
            Aucun ticket ouvert
          </div>
        )}
      </div>
    </div>
  );
}
