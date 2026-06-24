import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail, MessageCircle, Building2, Globe, Bug, Lightbulb, Briefcase, Handshake, Newspaper, Scale } from "lucide-react";

export const metadata = { title: "Nous contacter — Jam" };

const CHANNELS = [
  {
    Icon: Mail,
    title: "Email",
    value: "contact@jam.cm",
    sub: "Réponse sous 24h ouvrées",
    href: "mailto:contact@jam.cm",
  },
  {
    Icon: MessageCircle,
    title: "WhatsApp Business",
    value: "Jam Support",
    sub: "Réponse rapide en semaine",
    href: "https://wa.me/237600000000",
  },
  {
    Icon: Building2,
    title: "Siège social",
    value: "Douala, Cameroun",
    sub: "Elokan CS · Zone CEMAC",
    href: null,
  },
  {
    Icon: Globe,
    title: "Groupe Elokan CS",
    value: "elokan.cm",
    sub: "Studio de produits numériques",
    href: "/elokan",
  },
];

const SUBJECTS = [
  { Icon: Bug, label: "Signaler un bug" },
  { Icon: Lightbulb, label: "Suggestion de fonctionnalité" },
  { Icon: Briefcase, label: "Devenir prestataire partenaire" },
  { Icon: Handshake, label: "Partenariat commercial" },
  { Icon: Newspaper, label: "Presse & médias" },
  { Icon: Scale, label: "Question légale / RGPD" },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <header className="bg-[var(--color-card)]/80 backdrop-blur border-b border-[var(--color-border)] px-5 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/"><Image src="/jam-logo-primary.svg" alt="Jam" width={80} height={30} /></Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors">
            <ArrowLeft size={14} strokeWidth={2} />
            Accueil
          </Link>
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
          {CHANNELS.map(({ Icon, title, value, sub, href }) => (
            <div key={title} className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center mb-3">
                <Icon size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
              </div>
              <p className="font-semibold text-[var(--color-foreground)]">{title}</p>
              {href ? (
                <a href={href} className="text-[var(--color-primary)] hover:underline text-sm font-medium">{value}</a>
              ) : (
                <p className="text-sm font-medium text-[var(--color-foreground)]">{value}</p>
              )}
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Sujets de contact */}
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-6">
          <h2 className="font-semibold text-[var(--color-foreground)] mb-4">Quel est votre sujet ?</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {SUBJECTS.map(({ Icon, label }) => (
              <a
                key={label}
                href={`mailto:contact@jam.cm?subject=${encodeURIComponent(label)}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-background)] transition-all cursor-pointer"
              >
                <Icon size={16} className="text-[var(--color-muted-foreground)] shrink-0" strokeWidth={1.5} />
                <span className="text-[var(--color-foreground)]">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
