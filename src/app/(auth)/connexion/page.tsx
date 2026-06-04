import { signIn } from "@/lib/auth";
import Link from "next/link";

export default function ConnexionPage() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-8">
      <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)] mb-2">Connexion</h1>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-8">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-[var(--color-primary)] font-medium hover:underline">
          S'inscrire
        </Link>
      </p>
      <form
        action={async (formData) => {
          "use server";
          await signIn("credentials", {
            email: formData.get("email"),
            password: formData.get("password"),
            redirectTo: "/",
          });
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
