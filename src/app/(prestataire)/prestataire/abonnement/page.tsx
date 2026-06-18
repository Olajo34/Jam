import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatFCFA } from "@/lib/utils";
export default async function AbonnementPage() {
  const processing = false;
  const session = await auth();
  if (!session) redirect("/connexion");

  const prestataire = await prisma.prestataire.findUnique({
    where: { userId: session.user.id },
    include: { subscription: { include: { payments: { orderBy: { paidAt: "desc" }, take: 5 } } } },
  });
  if (!prestataire) redirect("/prestataire/onboarding");

  const config = await prisma.platformConfig.findUnique({ where: { id: "singleton" } }) ?? {
    freeBookingCap: 10, proBookingCap: 100, proPlanPrice: 5000, goldPlanPrice: 10000,
  };

  const sub = prestataire.subscription;
  const plan = sub?.plan ?? "FREE";
  const monthlyCount = sub?.monthlyCount ?? 0;

  const cap = plan === "GOLD" ? Infinity : plan === "PRO" ? config.proBookingCap : config.freeBookingCap;
  const pct = cap === Infinity ? 100 : Math.min(100, Math.round((monthlyCount / cap) * 100));
  const remaining = cap === Infinity ? "∞" : Math.max(0, cap - monthlyCount);

  const PLANS = [
    {
      key: "FREE",
      label: "Gratuit",
      price: 0,
      cap: config.freeBookingCap,
      features: ["Profil prestataire", "Catalogue de services", `${config.freeBookingCap} réservations/mois`],
    },
    {
      key: "PRO",
      label: "Pro",
      price: config.proPlanPrice,
      cap: config.proBookingCap,
      features: [`${config.proBookingCap} réservations/mois`, "Statistiques avancées", "Support prioritaire"],
    },
    {
      key: "GOLD",
      label: "Gold ⭐",
      price: config.goldPlanPrice,
      cap: null,
      features: ["Réservations illimitées", "Mise en avant dans l'app", "Badge Gold visible", "Support dédié"],
    },
  ];

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Abonnement</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">Gérez votre plan et suivez votre activité mensuelle.</p>
      </div>

      {processing && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <span className="text-xl">⏳</span>
          <div>
            <p className="font-medium text-amber-800 text-sm">Paiement en cours de traitement</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Votre paiement a bien été reçu. La mise à niveau de votre plan sera effective dans quelques instants.
              Rechargez la page pour voir votre nouveau plan.
            </p>
          </div>
        </div>
      )}

      {/* Current plan */}
      <div className={`rounded-2xl p-6 border ${plan === "GOLD" ? "bg-amber-50 border-amber-300" : plan === "PRO" ? "bg-purple-50 border-purple-200" : "bg-white border-[var(--color-border)]"}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-1">Plan actuel</p>
            <p className="text-3xl font-display font-semibold text-[var(--color-foreground)]">
              {plan === "GOLD" ? "Gold ⭐" : plan === "PRO" ? "Pro" : "Gratuit"}
            </p>
          </div>
          {sub?.endDate && (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Expire le {new Date(sub.endDate).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-[var(--color-foreground)] font-medium">
              {monthlyCount} réservation{monthlyCount > 1 ? "s" : ""} ce mois
            </span>
            <span className="text-[var(--color-muted-foreground)]">
              {cap === Infinity ? "Illimité" : `${remaining} restante${Number(remaining) > 1 ? "s" : ""}`}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "jam-gradient"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {pct >= 80 && plan !== "GOLD" && (
            <p className="text-xs text-amber-600 font-medium mt-1.5">
              ⚠️ Vous approchez de la limite — passez à un plan supérieur pour continuer à recevoir des réservations.
            </p>
          )}
          {monthlyCount >= (cap === Infinity ? Infinity : cap) && plan !== "GOLD" && (
            <p className="text-xs text-red-600 font-medium mt-1.5">
              🚫 Limite atteinte — vos nouvelles réservations sont bloquées jusqu'à la mise à niveau.
            </p>
          )}
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="font-semibold text-[var(--color-foreground)] mb-4">Changer de plan</h2>
        <div className="grid gap-4">
          {PLANS.map((p) => {
            const isCurrent = p.key === plan;
            return (
              <div
                key={p.key}
                className={`rounded-2xl border p-5 flex items-start justify-between gap-4 ${
                  isCurrent
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-[var(--color-border)] bg-white"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-[var(--color-foreground)]">{p.label}</p>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary)] text-white">
                        Actuel
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-display font-bold text-[var(--color-foreground)] mb-3">
                    {p.price === 0 ? "Gratuit" : `${formatFCFA(p.price)}/mois`}
                  </p>
                  <ul className="space-y-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                        <span className="text-emerald-500">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                {!isCurrent && p.price > 0 && (
                  <span className="shrink-0 px-4 py-2 rounded-full text-xs font-medium border border-[var(--color-border)] text-[var(--color-muted-foreground)] bg-[var(--color-cream)]">
                    Bientôt disponible
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-3">
          💳 Paiement mobile money bientôt disponible via PawaPay.
        </p>
      </div>

      {/* Payment history */}
      {sub?.payments && sub.payments.length > 0 && (
        <div>
          <h2 className="font-semibold text-[var(--color-foreground)] mb-4">Historique des paiements</h2>
          <div className="bg-white rounded-2xl border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
            {sub.payments.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-[var(--color-foreground)]">Plan {p.plan}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{new Date(p.paidAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <p className="font-semibold">{formatFCFA(p.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
