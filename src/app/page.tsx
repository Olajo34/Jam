import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-[var(--color-cream)]">
        <Image src="/jam-logo-primary.svg" alt="Jam" width={120} height={46} priority />
        <nav className="flex items-center gap-4">
          <Link
            href="/connexion"
            className="text-sm font-medium text-[var(--color-foreground)] hover:text-[var(--color-primary)]"
          >
            Connexion
          </Link>
          <Link
            href="/inscription"
            className="px-4 py-2 rounded-full text-sm font-medium text-white jam-gradient hover:opacity-90 transition-opacity"
          >
            S'inscrire
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 bg-[var(--color-cream)]">
        <span className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-muted)] text-[var(--color-primary)]">
          Beauté & Bien-être
        </span>
        <h1 className="text-5xl font-display font-semibold leading-tight tracking-tight text-[var(--color-foreground)] max-w-2xl mb-6">
          Réservez les{" "}
          <span className="jam-gradient-text">meilleurs professionnels</span>{" "}
          près de chez vous
        </h1>
        <p className="text-lg text-[var(--color-muted-foreground)] max-w-xl mb-10">
          Coiffure, massage, soin du visage, manucure... Trouvez, réservez et payez en toute sécurité via mobile money.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/recherche"
            className="px-8 py-3 rounded-full text-white font-medium jam-gradient hover:opacity-90 transition-opacity shadow-lg"
          >
            Trouver un prestataire
          </Link>
          <Link
            href="/prestataire/onboarding"
            className="px-8 py-3 rounded-full font-medium border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
          >
            Je suis prestataire
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-display font-semibold text-center mb-10 text-[var(--color-foreground)]">
            Nos catégories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/recherche?categorie=${cat.slug}`}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-cream)] transition-all"
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className="text-sm font-medium text-[var(--color-foreground)]">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Plans prestataires */}
      <section className="bg-[var(--color-cream)] px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-display font-semibold mb-3 text-[var(--color-foreground)]">
            Développez votre activité avec Jam
          </h2>
          <p className="text-[var(--color-muted-foreground)] mb-10">
            Commencez gratuitement. Passez à un plan supérieur quand votre activité décolle.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 text-left border ${
                  plan.featured
                    ? "bg-[var(--color-primary)] text-white border-transparent"
                    : "bg-white border-[var(--color-border)]"
                }`}
              >
                <p className="text-xs font-medium uppercase tracking-widest mb-2 opacity-70">{plan.label}</p>
                <p className="text-3xl font-display font-semibold mb-1">{plan.price}</p>
                <p className={`text-sm mb-6 ${plan.featured ? "text-white/70" : "text-[var(--color-muted-foreground)]"}`}>
                  {plan.period}
                </p>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[var(--color-dark)] text-white/60 text-sm text-center py-6 px-6">
        © {new Date().getFullYear()} Jam · Tous droits réservés
      </footer>
    </main>
  );
}

const CATEGORIES = [
  { name: "Coiffure", slug: "coiffure", emoji: "✂️" },
  { name: "Massage", slug: "massage", emoji: "💆" },
  { name: "Ongles", slug: "ongles", emoji: "💅" },
  { name: "Soins visage", slug: "soins", emoji: "🧖" },
  { name: "Maquillage", slug: "maquillage", emoji: "💄" },
  { name: "Épilation", slug: "epilation", emoji: "🌿" },
  { name: "Barbier", slug: "barbier", emoji: "🪒" },
  { name: "Bien-être", slug: "bienetre", emoji: "🧘" },
];

const PLANS = [
  {
    name: "free",
    label: "Gratuit",
    price: "0 FCFA",
    period: "jusqu'à 10 réservations/mois",
    featured: false,
    features: ["Profil prestataire", "Catalogue de services", "Paiement mobile money", "10 réservations/mois"],
  },
  {
    name: "pro",
    label: "Plan Pro",
    price: "5 000 FCFA",
    period: "par mois · 100 réservations",
    featured: true,
    features: ["Tout du plan gratuit", "Jusqu'à 100 réservations/mois", "Statistiques avancées", "Support prioritaire"],
  },
  {
    name: "gold",
    label: "Plan Gold",
    price: "15 000 FCFA",
    period: "par mois · illimité",
    featured: false,
    features: ["Réservations illimitées", "Mise en avant dans l'app", "Badge Gold visible", "Support dédié"],
  },
];
