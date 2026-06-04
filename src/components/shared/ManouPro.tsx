"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Suggestion = { icon: string; titre: string; texte: string };

export function ManouPro() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/manou-pro")
      .then((r) => r.json())
      .then((d) => setSuggestions(d.suggestions ?? []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)]">
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
              <div key={i} className="h-16 rounded-xl bg-[var(--color-cream)] animate-pulse" />
            ))}
          </div>
        )}
        {!loading && suggestions.length === 0 && (
          <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
            Aucune suggestion disponible pour l'instant.
          </p>
        )}
        {suggestions.map((s, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-cream)]">
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
