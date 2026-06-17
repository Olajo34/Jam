import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { recordFailedLogin, checkLoginLock, resetLoginAttempts } from "@/lib/actions/auth";

const ROLE_REDIRECT: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  MODERATEUR: "/moderateur/dashboard",
  PRESTATAIRE: "/prestataire/dashboard",
  USER: "/",
};

const ERROR_MESSAGES: Record<string, string> = {
  "1": "Email ou mot de passe incorrect.",
  locked: "Compte temporairement verrouillé suite à trop de tentatives.",
};

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string; locked?: string }>;
}) {
  const { redirect: redirectTo, error, locked } = await searchParams;

  const errorMsg = locked
    ? `Trop de tentatives échouées. Réessayez dans ${locked} minute${Number(locked) > 1 ? "s" : ""}.`
    : error
    ? (ERROR_MESSAGES[error] ?? "Email ou mot de passe incorrect.")
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-8">
      <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)] mb-2">Connexion</h1>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-8">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-[var(--color-primary)] font-medium hover:underline">
          S'inscrire
        </Link>
      </p>

      {errorMsg && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <form
        action={async (formData: FormData) => {
          "use server";
          const email = (formData.get("email") as string)?.toLowerCase().trim();
          const password = formData.get("password") as string;

          // Vérifier si le compte est verrouillé
          const lock = await checkLoginLock(email);
          if (lock.locked) redirect(`/connexion?locked=${lock.minutesLeft}`);

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user?.passwordHash) {
            redirect("/connexion?error=1");
          }
          const valid = await bcrypt.compare(password, user!.passwordHash!);
          if (!valid) {
            const result = await recordFailedLogin(email);
            if (result.locked) redirect(`/connexion?locked=${result.minutesLeft}`);
            redirect("/connexion?error=1");
          }

          // Succès — réinitialiser le compteur
          await resetLoginAttempts(email);

          const destination = redirectTo ? decodeURIComponent(redirectTo) : (ROLE_REDIRECT[user!.role] ?? "/");
          await signIn("credentials", { email, password, redirectTo: destination });
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-[var(--color-foreground)]">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-cream)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            placeholder="vous@exemple.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-[var(--color-foreground)]">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-cream)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 rounded-full font-medium text-white jam-gradient hover:opacity-90 transition-opacity mt-2"
        >
          Se connecter
        </button>
      </form>
    </div>
  );
}
