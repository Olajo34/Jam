import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "CGU — Conditions Générales d'Utilisation — Jam" };

export default function CguPage() {
  const year = new Date().getFullYear();
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
          <h1 className="text-4xl font-display font-semibold text-[var(--color-foreground)] mb-2">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">Dernière mise à jour : juin {year}</p>
        </div>

        {[
          {
            title: "1. Objet",
            content: `Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme Jam, éditée par Elokan CS. En accédant à la plateforme, l'utilisateur accepte sans réserve les présentes CGU.`,
          },
          {
            title: "2. Description du service",
            content: `Jam est une plateforme de mise en relation entre prestataires de beauté & bien-être et clients en zone CEMAC. Elle permet la réservation de prestations, le paiement via Mobile Money, et la gestion de l'activité des prestataires.`,
          },
          {
            title: "3. Inscription et compte",
            content: `L'inscription est ouverte à toute personne physique majeure. Les prestataires doivent fournir un Numéro d'Identification Unique (NIU) valide. L'utilisateur est responsable de la confidentialité de ses identifiants.`,
          },
          {
            title: "4. Réservations et paiements",
            content: `Les réservations sont confirmées après paiement via Mobile Money (Momo, Orange Money). Jam prélève une commission sur chaque transaction confirmée. Les remboursements sont soumis à la politique d'annulation.`,
          },
          {
            title: "5. Responsabilités",
            content: `Jam agit en tant qu'intermédiaire. La qualité des prestations relève de la responsabilité exclusive du prestataire. Jam ne peut être tenu responsable des litiges entre clients et prestataires.`,
          },
          {
            title: "6. Données personnelles",
            content: `Les données collectées sont traitées conformément à la législation camerounaise sur la cybersécurité et la protection des données personnelles (Loi n°2010/012). Les données ne sont pas vendues à des tiers.`,
          },
          {
            title: "7. Modification des CGU",
            content: `Elokan CS se réserve le droit de modifier les présentes CGU. Les utilisateurs seront informés par notification sur la plateforme. La poursuite de l'utilisation vaut acceptation des nouvelles conditions.`,
          },
          {
            title: "8. Droit applicable",
            content: `Les présentes CGU sont soumises au droit camerounais. Tout litige relève de la compétence des tribunaux de Douala, Cameroun.`,
          },
        ].map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-xl font-display font-semibold text-[var(--color-foreground)]">{section.title}</h2>
            <p className="text-[var(--color-muted-foreground)] leading-relaxed">{section.content}</p>
          </section>
        ))}

        <div className="border-t border-[var(--color-border)] pt-6 text-sm text-[var(--color-muted-foreground)]">
          Pour toute question : <Link href="/contact" className="text-[var(--color-primary)] hover:underline">nous contacter</Link>
        </div>
      </div>
    </main>
  );
}
