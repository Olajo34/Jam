"use client";

import { useActionState, useState } from "react";
import { registerUser } from "@/lib/actions/auth";
import Link from "next/link";

export default function InscriptionPage() {
  const [role, setRole] = useState<"USER" | "PRESTATAIRE">("USER");
  const [state, action, pending] = useActionState(registerUser, null);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-8">
      <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)] mb-2">
        Créer un compte
      </h1>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="text-[var(--color-primary)] font-medium hover:underline">
          Se connecter
        </Link>
      </p>

      {/* Role selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setRole("USER")}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
            role === "USER"
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)]/40"
          }`}
        >
          <span className="text-2xl">👤</span>
          <span className={`text-sm font-semibold ${role === "USER" ? "text-[var(--color-primary)]" : "text-[var(--color-foreground)]"}`}>
            Client
          </span>
          <span className="text-xs text-[var(--color-muted-foreground)]">Réserver des prestations</span>
        </button>
        <button
          type="button"
          onClick={() => setRole("PRESTATAIRE")}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
            role === "PRESTATAIRE"
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)]/40"
          }`}
        >
          <span className="text-2xl">💼</span>
          <span className={`text-sm font-semibold ${role === "PRESTATAIRE" ? "text-[var(--color-primary)]" : "text-[var(--color-foreground)]"}`}>
            Prestataire
          </span>
          <span className="text-xs text-[var(--color-muted-foreground)]">Proposer mes services</span>
        </button>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="role" value={role} />

        <Field id="name" label="Nom complet" type="text" placeholder="Votre nom" required autoComplete="name" />
        <Field id="email" label="Email" type="email" placeholder="vous@exemple.com" required autoComplete="email" />
        <Field id="phone" label="Téléphone" type="tel" placeholder="+225 07 00 00 00 00" autoComplete="tel"
          labelSuffix="optionnel" />

        {/* NIU — prestataires uniquement */}
        {role === "PRESTATAIRE" && (
          <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <label htmlFor="niu" className="text-sm font-medium text-[var(--color-foreground)]">
              NIU <span className="text-[var(--color-muted-foreground)] font-normal">(Numéro d'Identification Unique)</span>
            </label>
            <input
              id="niu" name="niu" type="text" required={role === "PRESTATAIRE"}
              placeholder="Ex: CI-2024-B-12345"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-cream)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Votre NIU apparaîtra sur votre profil professionnel et sera vérifié.
            </p>
          </div>
        )}

        <Field id="password" label="Mot de passe" type="password" placeholder="Minimum 8 caractères" required autoComplete="new-password" minLength={8} />

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 rounded-full font-medium text-white jam-gradient hover:opacity-90 transition-opacity mt-2 disabled:opacity-60"
        >
          {pending
            ? "Création en cours…"
            : role === "PRESTATAIRE"
            ? "Créer mon compte prestataire"
            : "Créer mon compte"}
        </button>

        {role === "PRESTATAIRE" && (
          <p className="text-xs text-center text-[var(--color-muted-foreground)]">
            Votre profil sera activé dès que vous aurez renseigné au moins <strong>3 services avec photos</strong>.
          </p>
        )}
      </form>
    </div>
  );
}

function Field({
  id, label, type, placeholder, required, autoComplete, labelSuffix, minLength,
}: {
  id: string; label: string; type: string; placeholder: string;
  required?: boolean; autoComplete?: string; labelSuffix?: string; minLength?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[var(--color-foreground)]">
        {label}{" "}
        {labelSuffix && <span className="text-[var(--color-muted-foreground)] font-normal">({labelSuffix})</span>}
      </label>
      <input
        id={id} name={id} type={type} required={required} autoComplete={autoComplete}
        placeholder={placeholder} minLength={minLength}
        className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-cream)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
      />
    </div>
  );
}
