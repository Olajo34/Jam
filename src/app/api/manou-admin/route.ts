import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const client = new Anthropic();

export async function GET() {
  const session = await auth();
  if (!session || !["ADMIN", "MODERATEUR"].includes(session.user.role)) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [prestataires, platformTotals] = await Promise.all([
    prisma.prestataire.findMany({
      where: { enrollmentStatus: "APPROVED" },
      include: {
        subscription: true,
        services: { where: { status: "ACTIVE" }, select: { id: true, photos: true } },
        bookings: {
          where: { createdAt: { gte: thirtyDaysAgo } },
          select: { status: true, createdAt: true },
        },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.payment.aggregate({
      where: { status: "SUCCESS", createdAt: { gte: startOfMonth } },
      _sum: { commission: true, amount: true },
    }),
  ]);

  // Analyse de chaque prestataire
  const analyses = prestataires.map((p) => {
    const monthBookings = p.bookings.filter((b) => new Date(b.createdAt) >= startOfMonth);
    const noShows = p.bookings.filter((b) => b.status === "NO_SHOW").length;
    const noShowRate = p.bookings.length > 0 ? Math.round((noShows / p.bookings.length) * 100) : 0;
    const plan = p.subscription?.plan ?? "FREE";
    const cap = plan === "GOLD" ? null : plan === "PRO" ? 100 : 10;
    const capPct = cap ? Math.round(((p.subscription?.monthlyCount ?? 0) / cap) * 100) : 0;
    const servicesWithPhotos = p.services.filter((s) => s.photos.length > 0).length;
    const profileIncomplete = servicesWithPhotos < 3;

    return {
      nom: p.businessName,
      ville: p.city ?? "—",
      plan,
      note: p.rating,
      nbAvis: p._count.reviews,
      resasMois: monthBookings.length,
      tauxNoShow: noShowRate,
      capaciteUtilisee: capPct,
      profilIncomplet: profileIncomplete,
      inactif: monthBookings.length === 0,
    };
  });

  // Prestataires signalés
  const signales = analyses.filter(
    (a) =>
      a.tauxNoShow > 20 ||
      (a.note > 0 && a.note < 3) ||
      a.capaciteUtilisee > 85 ||
      a.profilIncomplet ||
      a.inactif
  );

  const resumePlateforme = {
    totalPrestataires: prestataires.length,
    commissionsMois: platformTotals._sum.commission ?? 0,
    volumeMois: platformTotals._sum.amount ?? 0,
    prestatairesSignales: signales.length,
    noShowAlerts: analyses.filter((a) => a.tauxNoShow > 20).length,
    ratingAlerts: analyses.filter((a) => a.note > 0 && a.note < 3).length,
    inactifs: analyses.filter((a) => a.inactif).length,
    profilsIncomplets: analyses.filter((a) => a.profilIncomplet).length,
  };

  const systemPrompt = `Tu es Manou, experte en comptabilité et marketing pour Jam, plateforme beauté & bien-être en zone CEMAC.
Tu analyses les données opérationnelles et identifies les prestataires qui ne sont pas en règle ou représentent un risque business.

RÉSUMÉ PLATEFORME CE MOIS :
- ${resumePlateforme.totalPrestataires} prestataires actifs
- Commissions perçues : ${resumePlateforme.commissionsMois.toLocaleString("fr-FR")} FCFA
- Volume transactionnel : ${resumePlateforme.volumeMois.toLocaleString("fr-FR")} FCFA
- ${resumePlateforme.prestatairesSignales} prestataires nécessitent une attention
- ${resumePlateforme.noShowAlerts} avec taux no-show > 20%
- ${resumePlateforme.ratingAlerts} avec note < 3/5
- ${resumePlateforme.inactifs} inactifs ce mois
- ${resumePlateforme.profilsIncomplets} avec profil incomplet (< 3 services avec photos)

PRESTATAIRES SIGNALÉS :
${JSON.stringify(signales.slice(0, 10), null, 2)}

MISSION : En tant qu'experte comptabilité-marketing, génère 4 alertes prioritaires et recommandations concrètes pour l'équipe admin/modération. Identifie les risques financiers et de réputation.
FORMAT : Réponds UNIQUEMENT avec un JSON valide :
{"alertes": [{"niveau":"CRITIQUE|ATTENTION|INFO","icone":"emoji","titre":"...","texte":"...","action":"..."}]}
- CRITIQUE : risque immédiat pour la plateforme (churn, perte de revenus, réputation)
- ATTENTION : à surveiller cette semaine
- INFO : optimisation business recommandée
Chaque alerte doit être concrète, nommer des prestataires si possible, et proposer une action spécifique.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 800,
    messages: [{ role: "user", content: "Génère le rapport de conformité et les alertes business de cette semaine." }],
    system: systemPrompt,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";

  try {
    const parsed = JSON.parse(text);
    return Response.json({ ...parsed, resume: resumePlateforme });
  } catch {
    return Response.json({ alertes: [], resume: resumePlateforme });
  }
}
