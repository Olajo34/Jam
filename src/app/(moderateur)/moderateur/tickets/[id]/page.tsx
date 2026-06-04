import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { replyToTicket, closeTicket } from "@/lib/actions/tickets";
import Link from "next/link";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { ticket: { select: { id: true } } },
      },
    },
  });

  if (!ticket) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/moderateur/tickets" className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
          ← Tickets
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-display font-semibold text-[var(--color-foreground)]">{ticket.subject}</h1>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              De : {ticket.user.name ?? ticket.user.email} · {ticket.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          {["OPEN", "IN_PROGRESS"].includes(ticket.status) && (
            <form action={closeTicket.bind(null, ticket.id)}>
              <button type="submit" className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-cream)] transition-colors shrink-0">
                Marquer résolu ✓
              </button>
            </form>
          )}
        </div>
        {/* Original message */}
        <div className="mt-4 p-4 rounded-xl bg-[var(--color-cream)] text-sm text-[var(--color-foreground)]">
          {ticket.body}
        </div>
      </div>

      {/* Thread */}
      {ticket.messages.length > 0 && (
        <div className="space-y-3">
          {ticket.messages.map((msg) => {
            const isMod = msg.senderId !== ticket.user.id;
            return (
              <div key={msg.id} className={`flex ${isMod ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-lg rounded-2xl px-5 py-4 text-sm ${
                  isMod
                    ? "bg-[var(--color-primary)] text-white rounded-br-sm"
                    : "bg-white border border-[var(--color-border)] text-[var(--color-foreground)] rounded-bl-sm"
                }`}>
                  <p className={`text-xs font-medium mb-1.5 ${isMod ? "text-white/70" : "text-[var(--color-muted-foreground)]"}`}>
                    {isMod ? "Modérateur" : ticket.user.name ?? ticket.user.email}
                  </p>
                  <p>{msg.body}</p>
                  <p className={`text-xs mt-2 ${isMod ? "text-white/50" : "text-[var(--color-muted-foreground)]"}`}>
                    {msg.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · {msg.createdAt.toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply form */}
      {["OPEN", "IN_PROGRESS"].includes(ticket.status) && (
        <form
          action={async (formData: FormData) => {
            "use server";
            const body = formData.get("body") as string;
            if (body?.trim()) await replyToTicket(id, body.trim());
          }}
          className="bg-white rounded-2xl border border-[var(--color-border)] p-5 space-y-3"
        >
          <p className="text-sm font-medium text-[var(--color-foreground)]">Répondre au client</p>
          <textarea
            name="body"
            required
            rows={4}
            placeholder="Votre réponse..."
            className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-cream)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-full text-sm font-medium text-white jam-gradient hover:opacity-90 transition-opacity"
          >
            Envoyer la réponse
          </button>
        </form>
      )}
    </div>
  );
}
