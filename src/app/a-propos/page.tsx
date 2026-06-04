import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "À propos — Jam" };

export default function AProposPage() {
  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <header className="bg-[var(--color-card)]/80 backdrop-blur border-b border-[var(--color-border)] px-5 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/"><Image src="/jam-logo-primary.svg" alt="Jam" width={80} height={30} /></Link>
          <Link href="/" className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">← Accueil</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-16 space-y-12">
        <div>
          <h1 className="text-4xl font-display font-semibold text-[var(--color-foreground)] mb-4">À propos de Jam</h1>
          <p className="text-lg text-[var(--color-muted-foreground)] leading-relaxed">
            Jam est la première plateforme de réservation beauté & bien-être pensée pour les marchés africains — mobile first, paiement Mobile Money natif, expérience locale authentique.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Notre mission</h2>
          <p className="text-[var(--color-muted-foreground)] leading-relaxed">
            Connecter les clients aux meilleurs professionnels de beauté et bien-être en zone CEMAC, en éliminant les frictions : plus de recherche par WhatsApp, plus d'incertitude sur les disponibilités, plus de paiements en espèces non sécurisés.
          </p>
          <p className="text-[var(--color-muted-foreground)] leading-relaxed">
            Jam permet aux prestataires — coiffeuses, masseuses, esthéticiennes, barbiers — de gérer leur activité comme une vraie entreprise : agenda digital, paiements traçables, statistiques, et Manou leur assistante IA.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Notre vision</h2>
          <p className="text-[var(--color-muted-foreground)] leading-relaxed">
            Devenir la référence du secteur beauté & bien-être en Afrique centrale et subsaharienne — un marché de plusieurs milliards, encore invisible en ligne, que Jam s'engage à révéler et structurer.
          </p>
        </section>

        <section className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-6 space-y-3">
          <h2 className="text-xl font-display font-semibold text-[var(--color-foreground)]">Chiffres clés</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: "+500", label: "Prestataires actifs" },
              { value: "5", label: "Pays CEMAC" },
              { value: "24h/24", label: "Manou disponible" },
            ].map((k) => (
              <div key={k.label}>
                <p className="text-2xl font-display font-semibold jam-gradient-text">{k.value}</p>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="text-sm text-[var(--color-muted-foreground)]">
          Jam est une marque du groupe <Link href="/elokan" className="text-[var(--color-primary)] hover:underline">Elokan CS</Link>.
        </div>
      </div>
    </main>
  );
}
