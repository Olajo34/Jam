import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Accessibilité — Jam" };

export default function AccessibilitePage() {
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
          <h1 className="text-4xl font-display font-semibold text-[var(--color-foreground)] mb-4">Accessibilité</h1>
          <p className="text-lg text-[var(--color-muted-foreground)] leading-relaxed">
            Jam s'engage à rendre sa plateforme accessible au plus grand nombre, quelles que soient les conditions de navigation ou les capacités de l'utilisateur.
          </p>
        </div>

        {[
          {
            icon: "📱",
            title: "Mobile first",
            content: "Jam est conçu en priorité pour les smartphones. L'interface s'adapte à toutes les tailles d'écran, des petits téléphones d'entrée de gamme aux grandes tablettes.",
          },
          {
            icon: "📶",
            title: "Faible connectivité",
            content: "La plateforme est optimisée pour fonctionner avec une connexion 2G/3G instable, fréquente dans les zones secondaires de la zone CEMAC. Les pages sont légères et les images compressées.",
          },
          {
            icon: "🌍",
            title: "Multilingue",
            content: "Jam est disponible en français et en anglais. Le support du pidgin camerounais est prévu dans les prochaines versions pour les interactions avec Manou.",
          },
          {
            icon: "💳",
            title: "Paiement inclusif",
            content: "La plateforme accepte MTN Mobile Money et Orange Money, accessibles sans carte bancaire, permettant à tout détenteur d'un téléphone mobile de réserver et payer.",
          },
          {
            icon: "♿",
            title: "Navigation au clavier",
            content: "Les formulaires et boutons sont navigables au clavier. Les images disposent d'alternatives textuelles (attributs alt).",
          },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-4 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5">
            <span className="text-2xl shrink-0">{item.icon}</span>
            <div>
              <p className="font-semibold text-[var(--color-foreground)] mb-1">{item.title}</p>
              <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">{item.content}</p>
            </div>
          </div>
        ))}

        <div className="text-sm text-[var(--color-muted-foreground)]">
          Vous avez identifié un problème d'accessibilité ?{" "}
          <Link href="/contact" className="text-[var(--color-primary)] hover:underline">Signalez-le nous</Link>.
        </div>
      </div>
    </main>
  );
}
