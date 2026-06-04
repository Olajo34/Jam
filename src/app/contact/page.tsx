import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Nous contacter — Jam" };

export default function ContactPage() {
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
          <h1 className="text-4xl font-display font-semibold text-[var(--color-foreground)] mb-4">Nous contacter</h1>
          <p className="text-lg text-[var(--color-muted-foreground)] leading-relaxed">
            Une question, un problème ou une proposition ? Notre équipe vous répond dans les 24 heures.
          </p>
        </div>

        {/* Canaux de contact */}
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              icon: "📧",
              title: "Email",
              value: "contact@jam.cm",
              sub: "Réponse sous 24h ouvrées",
              href: "mailto:contact@jam.cm",
            },
            {
              icon: "💬",
              title: "WhatsApp Business",
              value: "Jam Support",
              sub: "Réponse rapide en semaine",
              href: "https://wa.me/237600000000",
            },
            {
              icon: "🏢",
              title: "Siège social",
              value: "Douala, Cameroun",
              sub: "Elokan CS · Zone CEMAC",
              href: null,
            },
            {
              icon: "🌐",
              title: "Groupe Elokan CS",
              value: "elokan.cm",
              sub: "Studio de produits numériques",
              href: "/elokan",
            },
          ].map((c) => (
            <div key={c.title} className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5">
              <p className="text-2xl mb-2">{c.icon}</p>
              <p className="font-semibold text-[var(--color-foreground)]">{c.title}</p>
              {c.href ? (
                <a href={c.href} className="text-[var(--color-primary)] hover:underline text-sm font-medium">{c.value}</a>
              ) : (
                <p className="text-sm font-medium text-[var(--color-foreground)]">{c.value}</p>
              )}
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Objet du contact */}
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-6">
          <h2 className="font-semibold text-[var(--color-foreground)] mb-4">Quel est votre sujet ?</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {[
              { emoji: "🐛", label: "Signaler un bug" },
              { emoji: "💡", label: "Suggestion de fonctionnalité" },
              { emoji: "💼", label: "Devenir prestataire partenaire" },
              { emoji: "🤝", label: "Partenariat commercial" },
              { emoji: "📰", label: "Presse & médias" },
              { emoji: "⚖️", label: "Question légale / RGPD" },
            ].map((s) => (
              <a
                key={s.label}
                href={`mailto:contact@jam.cm?subject=${encodeURIComponent(s.label)}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-background)] transition-all"
              >
                <span>{s.emoji}</span>
                <span className="text-[var(--color-foreground)]">{s.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
