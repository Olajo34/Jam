import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Groupe Elokan CS — Jam" };

export default function ElokanPage() {
  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <header className="bg-[var(--color-card)]/80 backdrop-blur border-b border-[var(--color-border)] px-5 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/"><Image src="/jam-logo-primary.svg" alt="Jam" width={80} height={30} /></Link>
          <Link href="/" className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">← Accueil</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-16 space-y-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-3">Groupe</p>
          <h1 className="text-4xl font-display font-semibold text-[var(--color-foreground)] mb-4">Elokan CS</h1>
          <p className="text-lg text-[var(--color-muted-foreground)] leading-relaxed">
            Elokan CS est un studio de développement de produits numériques spécialisé dans la création de plateformes adaptées aux réalités des marchés africains — Mobile Money, faible connectivité, usage smartphone dominant.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Notre approche</h2>
          <p className="text-[var(--color-muted-foreground)] leading-relaxed">
            Nous concevons des produits qui partent des contraintes locales plutôt que d'importer des solutions globales inadaptées. Chaque plateforme est pensée pour fonctionner en faible connectivité, intégrer les paiements Mobile Money natifs, et répondre aux usages réels des populations locales et de la diaspora.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Nos marques</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5">
              <p className="font-semibold text-[var(--color-foreground)] mb-1">Jam</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">Réservation beauté & bien-être · Zone CEMAC</p>
            </div>
            <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5 opacity-60">
              <p className="font-semibold text-[var(--color-foreground)] mb-1">Autres projets</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">Prochainement…</p>
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-6">
          <h2 className="text-xl font-display font-semibold text-[var(--color-foreground)] mb-3">Contact groupe</h2>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
            Pour les partenariats, investissements ou collaborations avec Elokan CS :
          </p>
          <Link href="/contact" className="inline-flex px-5 py-2.5 rounded-full text-sm font-semibold text-white jam-gradient hover:opacity-90 transition-opacity">
            Nous contacter
          </Link>
        </section>
      </div>
    </main>
  );
}
