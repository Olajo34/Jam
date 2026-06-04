"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Niveau = "CRITIQUE" | "ATTENTION" | "INFO";

type Alerte = {
  niveau: Niveau;
  icone: string;
  titre: string;
  texte: string;
  action: string;
};

type Resume = {
  totalPrestataires: number;
  prestatairesSignales: number;
  noShowAlerts: number;
  ratingAlerts: number;
  inactifs: number;
  profilsIncomplets: number;
};

const NIVEAU_STYLE: Record<Niveau, string> = {
  CRITIQUE: "border-l-4 border-red-400 bg-red-50",
  ATTENTION: "border-l-4 border-amber-400 bg-amber-50",
  INFO: "border-l-4 border-blue-400 bg-blue-50",
};

const NIVEAU_BADGE: Record<Niveau, string> = {
  CRITIQUE: "bg-red-100 text-red-700",
  ATTENTION: "bg-amber-100 text-amber-700",
  INFO: "bg-blue-100 text-blue-700",
};

export function ManouAdmin() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/manou-admin")
      .then((r) => r.json())
      .then((d) => {
        setAlertes(d.alertes ?? []);
        setResume(d.resume ?? null);
      })
      .catch(() => setAlertes([]))
      .finally(() => setLoading(false));
  }, []);

  const critiques = alertes.filter((a) => a.niveau === "CRITIQUE").length;

  return (
    <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
          <Image src="/images/manou-avatar.jpg" alt="Manou" width={36} height={36} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[var(--color-foreground)] text-sm">
              Manou — Expert Comptabilité &amp; Marketing
            </p>
            {critiques > 0 && !loading && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
                {critiques} critique{critiques > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)]">Rapport de conformité — prestataires signalés</p>
        </div>
      </div>

      {/* Compteurs résumé */}
      {resume && !loading && (
        <div className="px-6 py-3 bg-[var(--color-background)] border-b border-[var(--color-border)] flex flex-wrap gap-4 text-xs">
          <span className="text-[var(--color-muted-foreground)]">
            <strong className="text-[var(--color-foreground)]">{resume.prestatairesSignales}</strong> signalés
            {" / "}{resume.totalPrestataires} actifs
          </span>
          {resume.noShowAlerts > 0 && (
            <span className="text-red-600">⚠️ {resume.noShowAlerts} no-show &gt;20%</span>
          )}
          {resume.ratingAlerts > 0 && (
            <span className="text-amber-600">★ {resume.ratingAlerts} note &lt;3</span>
          )}
          {resume.inactifs > 0 && (
            <span className="text-gray-500">😴 {resume.inactifs} inactifs ce mois</span>
          )}
          {resume.profilsIncomplets > 0 && (
            <span className="text-blue-600">📋 {resume.profilsIncomplets} profils incomplets</span>
          )}
        </div>
      )}

      {/* Alertes */}
      <div className="p-4 space-y-3">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-[var(--color-muted)] animate-pulse" />
            ))}
          </div>
        )}

        {!loading && alertes.length === 0 && (
          <div className="text-center py-6">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm font-medium text-[var(--color-foreground)]">Tous les prestataires sont en règle</p>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">Aucune alerte à signaler cette semaine.</p>
          </div>
        )}

        {alertes.map((a, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setExpanded(expanded === i ? null : i)}
            className={`w-full text-left rounded-xl p-4 transition-all ${NIVEAU_STYLE[a.niveau]}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">{a.icone}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${NIVEAU_BADGE[a.niveau]}`}>
                    {a.niveau}
                  </span>
                  <p className="text-sm font-semibold text-[var(--color-foreground)] truncate">{a.titre}</p>
                </div>
                {expanded === i && (
                  <>
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-1 leading-relaxed">{a.texte}</p>
                    <p className="text-xs font-medium text-[var(--color-foreground)] mt-2">
                      → {a.action}
                    </p>
                  </>
                )}
                {expanded !== i && (
                  <p className="text-xs text-[var(--color-muted-foreground)] truncate">{a.texte}</p>
                )}
              </div>
              <span className="text-xs text-[var(--color-muted-foreground)] shrink-0 mt-0.5">
                {expanded === i ? "▲" : "▼"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
