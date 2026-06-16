import { prisma } from "@/lib/prisma";
import { savePlatformConfig } from "@/lib/actions/platform";

export default async function ParametresPage() {
  const config = await prisma.platformConfig.findUnique({ where: { id: "singleton" } }) ?? {
    commissionRate: 0.07,
    proCommissionRate: 0.05,
    goldCommissionRate: 0.03,
    proPlanPrice: 5000,
    goldPlanPrice: 15000,
    proBookingCap: 100,
    freeBookingCap: 10,
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Paramètres plateforme</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
          Taux de commission et plans d'abonnement prestataires
        </p>
      </div>

      <form action={savePlatformConfig} className="space-y-6">
        {/* Commission */}
        <section className="bg-white rounded-2xl border border-[var(--color-border)] p-6 space-y-4">
          <h2 className="font-semibold text-[var(--color-foreground)]">Commissions par plan</h2>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Le taux est automatiquement appliqué selon le plan actif du prestataire au moment du paiement.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {/* FREE */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-cream)] p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-3">Gratuit</p>
              <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1">Commission (%)</label>
              <input
                name="commissionRate"
                type="number" step="0.1" min="0" max="50"
                defaultValue={(config.commissionRate * 100).toFixed(1)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                Sur 10 000 FCFA → {(10000 * config.commissionRate).toFixed(0)} FCFA
              </p>
            </div>
            {/* PRO */}
            <div className="rounded-xl border-2 border-[var(--color-primary)]/30 bg-purple-50/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-3">Pro</p>
              <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1">Commission (%)</label>
              <input
                name="proCommissionRate"
                type="number" step="0.1" min="0" max="50"
                defaultValue={((config as { proCommissionRate?: number }).proCommissionRate ?? 0.05) * 100}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                Sur 10 000 FCFA → {(10000 * ((config as { proCommissionRate?: number }).proCommissionRate ?? 0.05)).toFixed(0)} FCFA
              </p>
            </div>
            {/* GOLD */}
            <div className="rounded-xl border-2 border-amber-300/60 bg-amber-50/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-3">Gold ⭐</p>
              <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1">Commission (%)</label>
              <input
                name="goldCommissionRate"
                type="number" step="0.1" min="0" max="50"
                defaultValue={((config as { goldCommissionRate?: number }).goldCommissionRate ?? 0.03) * 100}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                Sur 10 000 FCFA → {(10000 * ((config as { goldCommissionRate?: number }).goldCommissionRate ?? 0.03)).toFixed(0)} FCFA
              </p>
            </div>
          </div>
        </section>

        {/* Plans */}
        <section className="bg-white rounded-2xl border border-[var(--color-border)] p-6 space-y-5">
          <h2 className="font-semibold text-[var(--color-foreground)]">Plans d'abonnement</h2>

          <div className="grid grid-cols-3 gap-4">
            {/* Free */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-cream)] p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-3">Gratuit</p>
              <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1">
                Réservations max / mois
              </label>
              <input
                name="freeBookingCap"
                type="number"
                min="1"
                defaultValue={config.freeBookingCap}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            {/* Pro */}
            <div className="rounded-xl border-2 border-[var(--color-primary)]/30 bg-purple-50/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-3">Pro</p>
              <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1">Prix / mois (FCFA)</label>
              <input
                name="proPlanPrice"
                type="number"
                min="0"
                defaultValue={config.proPlanPrice}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] mb-2"
              />
              <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1">Réservations max / mois</label>
              <input
                name="proBookingCap"
                type="number"
                min="1"
                defaultValue={config.proBookingCap}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            {/* Gold */}
            <div className="rounded-xl border-2 border-amber-300/60 bg-amber-50/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-3">Gold ⭐</p>
              <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1">Prix / mois (FCFA)</label>
              <input
                name="goldPlanPrice"
                type="number"
                min="0"
                defaultValue={config.goldPlanPrice}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] mb-2"
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">Réservations illimitées + mise en avant</p>
            </div>
          </div>
        </section>

        <button
          type="submit"
          className="px-8 py-3 rounded-full font-medium text-white jam-gradient hover:opacity-90 transition-opacity"
        >
          Enregistrer les paramètres
        </button>
      </form>
    </div>
  );
}
