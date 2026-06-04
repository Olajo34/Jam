"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Suggestion = { icon: string; titre: string; texte: string };

export function ManouPro({ plan = "FREE" }: { plan?: string }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (plan === "FREE") return;
    fetch("/api/manou-pro")
      .then((r) => r.json())
      .then((d) => setSuggestions(d.suggestions ?? []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [plan]);

  if (plan === "FREE") {
    return (
      <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
          <Image src="/images/manou-avatar.jpg" alt="Manou" width={40} height={40} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-[var(--color-foreground)]">Manou — Assistante IA business</p>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1 leading-relaxed">
            Manou analyse votre activité chaque semaine et vous donne des suggestions concrètes pour réduire les no-shows, optimiser vos créneaux et augmenter votre CA.
          </p>
          <a
            href="/prestataire/abonnement"
            className="inline-block mt-3 px-5 py-2 rounded-full text-sm font-semibold text-white jam-gradient hover:opacity-90 transition-opacity"
          >
            Passer au Plan Pro pour débloquer Manou →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)]">
      <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0">
          <Image src="/images/manou-avatar.jpg" alt="Manou" width={32} height={32} className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="font-semibold text-[var(--color-foreground)] text-sm">Manou — Suggestions business</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">Générées à partir de votre activité ce mois</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-[var(--color-muted)] animate-pulse" />
            ))}
          </div>
        )}
        {!loading && suggestions.length === 0 && (
          <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
            Aucune suggestion disponible pour l'instant.
          </p>
        )}
        {suggestions.map((s, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-background)]">
            <span className="text-xl shrink-0">{s.icon}</span>
            <div>
              <p className="text-sm font-semibold text-[var(--color-foreground)]">{s.titre}</p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 leading-relaxed">{s.texte}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
