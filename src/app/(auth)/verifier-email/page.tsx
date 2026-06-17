import Link from "next/link";

export default async function VerifierEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { success, error } = await searchParams;

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h1 className="text-xl font-display font-semibold text-[var(--color-foreground)] mb-2">
          Email vérifié !
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
          Votre adresse email a été confirmée avec succès.
        </p>
        <Link href="/" className="px-6 py-2.5 rounded-full text-sm font-medium text-white jam-gradient hover:opacity-90">
          Aller sur l'accueil
        </Link>
      </div>
    );
  }

  const messages: Record<string, string> = {
    expired: "Ce lien de vérification a expiré. Créez un nouveau compte ou contactez le support.",
    invalid: "Ce lien est invalide ou déjà utilisé.",
    missing: "Aucun token fourni.",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-10 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">✉️</span>
      </div>
      <h1 className="text-xl font-display font-semibold text-[var(--color-foreground)] mb-2">
        {error ? "Lien invalide" : "Vérifiez votre email"}
      </h1>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
        {error
          ? (messages[error] ?? "Lien de vérification invalide.")
          : "Un email de confirmation a été envoyé à votre adresse. Cliquez sur le lien pour activer votre compte."}
      </p>
      <Link href="/connexion" className="text-sm text-[var(--color-primary)] font-medium hover:underline">
        Retour à la connexion
      </Link>
    </div>
  );
}
