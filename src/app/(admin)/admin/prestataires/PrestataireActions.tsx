"use client";

import { useState, useTransition } from "react";
import {
  sendReminderToPrestataire,
  suspendPrestataire,
  reinstatePrestataire,
  terminatePrestataire,
} from "@/lib/actions/admin";

export default function PrestataireActions({
  prestataireId,
  userId,
  isSuspended,
}: {
  prestataireId: string;
  userId: string;
  isSuspended: boolean;
}) {
  const [mode, setMode] = useState<"idle" | "suspend" | "terminate">("idle");
  const [reason, setReason] = useState("");
  const [flash, setFlash] = useState("");
  const [isPending, startTransition] = useTransition();

  function ok(msg: string) {
    setFlash(msg);
    setMode("idle");
    setReason("");
    setTimeout(() => setFlash(""), 3000);
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[200px]">
      {flash && <p className="text-xs text-emerald-600 font-medium">{flash}</p>}

      {mode === "idle" && (
        <div className="flex flex-wrap gap-1.5">
          {/* Relancer */}
          <button
            onClick={() =>
              startTransition(async () => {
                await sendReminderToPrestataire(prestataireId);
                ok("Relance enregistrée ✓");
              })
            }
            disabled={isPending}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 border border-blue-200 hover:bg-blue-50 disabled:opacity-50 transition-colors"
          >
            📨 Relancer
          </button>

          {/* Suspendre / Réactiver */}
          {isSuspended ? (
            <button
              onClick={() =>
                startTransition(async () => {
                  await reinstatePrestataire(prestataireId);
                  ok("Compte réactivé ✓");
                })
              }
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-50 disabled:opacity-50 transition-colors"
            >
              ✓ Réactiver
            </button>
          ) : (
            <button
              onClick={() => setMode("suspend")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 border border-amber-200 hover:bg-amber-50 transition-colors"
            >
              ⏸ Suspendre
            </button>
          )}

          {/* Résilier */}
          <button
            onClick={() => setMode("terminate")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
          >
            🗑 Résilier
          </button>
        </div>
      )}

      {/* Formulaire suspension */}
      {mode === "suspend" && (
        <div className="flex flex-col gap-2 p-3 rounded-xl border border-amber-200 bg-amber-50">
          <p className="text-xs font-semibold text-amber-800">Motif de suspension</p>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: profil incomplet, signalement client…"
            className="px-3 py-1.5 rounded-lg border border-amber-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <div className="flex gap-2">
            <button
              onClick={() =>
                startTransition(async () => {
                  await suspendPrestataire(prestataireId, reason);
                  ok("Compte suspendu");
                })
              }
              disabled={!reason.trim() || isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              Confirmer
            </button>
            <button
              onClick={() => { setMode("idle"); setReason(""); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:bg-white transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Confirmation résiliation */}
      {mode === "terminate" && (
        <div className="flex flex-col gap-2 p-3 rounded-xl border border-red-200 bg-red-50">
          <p className="text-xs font-semibold text-red-700">
            ⚠️ Action irréversible — supprime le compte et toutes les données associées.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                startTransition(async () => {
                  await terminatePrestataire(userId);
                })
              }
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Confirmer résiliation
            </button>
            <button
              onClick={() => setMode("idle")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:bg-white transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
