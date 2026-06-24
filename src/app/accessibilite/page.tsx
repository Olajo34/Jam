import Link from "next/link";
import Image from "next/image";
import { Smartphone, Wifi, Globe, CreditCard, Keyboard } from "lucide-react";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Accessibilité — Jam" };

const FEATURES = [
  {
    icon: Smartphone,
    title: "Mobile first",
    content: "Jam est conçu en priorité pour les smartphones. L'interface s'adapte à toutes les tailles d'écran, des petits téléphones d'entrée de gamme aux grandes tablettes.",
  },
  {
    icon: Wifi,
    title: "Faible connectivité",
    content: "La plateforme est optimisée pour fonctionner avec une connexion 2G/3G instable, fréquente dans les zones secondaires de la zone CEMAC. Les pages sont légères et les images compressées.",
  },
  {
    icon: Globe,
    title: "Multilingue",
    content: "Jam est disponible en français et en anglais. Le support du pidgin camerounais est prévu dans les prochaines versions pour les interactions avec Manou.",
  },
  {
    icon: CreditCard,
    title: "Paiement inclusif",
    content: "La plateforme accepte Momo et Orange Money, accessibles sans carte bancaire, permettant à tout détenteur d'un téléphone mobile de réserver et payer.",
  },
  {
    icon: Keyboard,
    title: "Navigation au clavier",
    content: "Les formulaires et boutons sont navigables au clavier. Les images disposent d'alternatives textuelles (attributs alt).",
  },
];

export default function AccessibilitePage() {
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
          <h1 className="text-4xl font-display font-semibold text-[var(--color-foreground)] mb-4">Accessibilité</h1>
          <p className="text-lg text-[var(--color-muted-foreground)] leading-relaxed">
            Jam s&apos;engage à rendre sa plateforme accessible au plus grand nombre, quelles que soient les conditions de navigation ou les capacités de l&apos;utilisateur.
          </p>
        </div>

        {FEATURES.map(({ icon: Icon, title, content }) => (
          <div key={title} className="flex items-start gap-4 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
              <Icon size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-semibold text-[var(--color-foreground)] mb-1">{title}</p>
              <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">{content}</p>
            </div>
          </div>
        ))}

        <div className="text-sm text-[var(--color-muted-foreground)]">
          Vous avez identifié un problème d&apos;accessibilité ?{" "}
          <Link href="/contact" className="text-[var(--color-primary)] hover:underline">Signalez-le nous</Link>.
        </div>
      </div>
    </main>
  );
}
