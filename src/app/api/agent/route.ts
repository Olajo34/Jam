import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Non autorisé" }, { status: 401 });

  const { message, history = [] } = await req.json();

  // Injection de contexte depuis la DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      bookings: {
        take: 3,
        orderBy: { scheduledAt: "desc" },
        include: { service: { select: { name: true } }, prestataire: { select: { businessName: true } } },
      },
    },
  });

  const recentBookings = user?.bookings
    .map((b) => `${b.service.name} chez ${b.prestataire.businessName}`)
    .join(", ") || "aucune";

  const systemPrompt = `Tu es Jam, l'assistant de réservation beauté et bien-être en Côte d'Ivoire.
Ton rôle : aider le client à trouver et réserver le bon prestataire, 24h/24.

CONTEXTE CLIENT :
- Prénom : ${user?.name ?? "Client"}
- Dernières réservations : ${recentBookings}

RÈGLES :
- Réponds TOUJOURS dans la langue du message (FR ou EN)
- Pose maximum UNE question à la fois
- Sois chaleureux, direct, jamais condescendant
- Si tu confirmes un booking, retourne un JSON structuré : {"action":"book","prestataire_id":"...","slot":"..."}
- Si aucun prestataire n'est disponible, propose le créneau suivant`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    system: systemPrompt,
    messages: [
      ...history,
      { role: "user", content: message },
    ],
  });

  const reply = response.content[0].type === "text" ? response.content[0].text : "";

  return Response.json({ reply });
}
