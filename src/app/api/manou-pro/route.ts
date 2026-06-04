import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const client = new Anthropic();

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "PRESTATAIRE") {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const prestataire = await prisma.prestataire.findUnique({
    where: { userId: session.user.id },
    include: {
      subscription: true,
      services: { where: { status: "ACTIVE" } },
      bookings: {
        take: 30,
        orderBy: { scheduledAt: "desc" },
        include: { service: { select: { name: true, price: true } } },
      },
      reviews: { take: 10, orderBy: { createdAt: "desc" }, select: { rating: true, comment: true } },
    },
  });

  if (!prestataire) return Response.json({ suggestions: [] });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthBookings = prestataire.bookings.filter((b) => new Date(b.scheduledAt) >= startOfMonth);
  const noShows = prestataire.bookings.filter((b) => b.status === "NO_SHOW").length;
  const confirmed = prestataire.bookings.filter((b) => b.status === "COMPLETED").length;
  const noShowRate = prestataire.bookings.length > 0 ? Math.round((noShows / prestataire.bookings.length) * 100) : 0;
  const avgRating = prestataire.reviews.length > 0
    ? (prestataire.reviews.reduce((s, r) => s + r.rating, 0) / prestataire.reviews.length).toFixed(1)
    : "—";

  const systemPrompt = `Tu es Manou, l'assistante business de ${prestataire.businessName}, professionnelle de beauté sur Jam.
CONTEXTE MÉTIER :
- Spécialité : ${prestataire.services.map((s) => s.name).join(", ") || "non définie"}
- Ville : ${prestataire.city ?? "non renseignée"}
- Plan : ${prestataire.subscription?.plan ?? "FREE"}
- Réservations ce mois : ${monthBookings.length}
- Taux no-show : ${noShowRate}%
- Note moyenne : ${avgRating}/5
- Services actifs : ${prestataire.services.length}

MISSION : Génère 3 suggestions business courtes et actionnables pour améliorer l'activité ce mois-ci.
FORMAT : Réponds UNIQUEMENT avec un JSON valide : {"suggestions": [{"icon":"emoji","titre":"...","texte":"..."}]}
Chaque suggestion doit être concrète, spécifique au contexte, et réalisable cette semaine.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    messages: [{ role: "user", content: "Génère mes suggestions business de la semaine." }],
    system: systemPrompt,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";

  try {
    const parsed = JSON.parse(text);
    return Response.json(parsed);
  } catch {
    return Response.json({ suggestions: [] });
  }
}
