"use client";

import { useState, useTransition } from "react";
import { saveAvailabilities, type AvailabilityInput } from "@/lib/actions/prestataire";

const DAYS = [
  { index: 1, label: "Lundi" },
  { index: 2, label: "Mardi" },
  { index: 3, label: "Mercredi" },
  { index: 4, label: "Jeudi" },
  { index: 5, label: "Vendredi" },
  { index: 6, label: "Samedi" },
  { index: 0, label: "Dimanche" },
];

type InitialAvailability = {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
};

export default function AvailabilityForm({
  initial,
}: {
  initial: InitialAvailability[];
}) {
  const [slots, setSlots] = useState<AvailabilityInput[]>(
    DAYS.map(({ index }) => {
      const found = initial.find((a) => a.dayOfWeek === index);
      return {
        dayOfWeek: index,
        isActive: found?.isActive ?? false,
        startTime: found?.startTime ?? "09:00",
        endTime: found?.endTime ?? "18:00",
      };
    }),
  );

  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  function update(dayIndex: number, patch: Partial<AvailabilityInput>) {
    setSlots((prev) =>
      prev.map((s) => (s.dayOfWeek === dayIndex ? { ...s, ...patch } : s)),
    );
    setStatus("idle");
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveAvailabilities(slots);
      setStatus(result.error ? "error" : "success");
      if (result.success) setTimeout(() => setStatus("idle"), 3000);
    });
  }

  return (
    <div className="space-y-3">
      {DAYS.map(({ index, label }) => {
        const slot = slots.find((s) => s.dayOfWeek === index)!;
        return (
          <div
            key={index}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
              slot.isActive
                ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5"
                : "border-[var(--color-border)] bg-white"
            }`}
          >
            {/* Toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={slot.isActive}
              aria-label={`${label} ${slot.isActive ? "ouvert" : "fermé"}`}
              onClick={() => update(index, { isActive: !slot.isActive })}
              className={`relative w-10 h-5 rounded-full transition-colors shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] ${
                slot.isActive ? "bg-[var(--color-primary)]" : "bg-[var(--color-muted)]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  slot.isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>

            {/* Jour */}
            <span
              className={`w-24 text-sm font-medium shrink-0 ${
                slot.isActive ? "text-[var(--color-foreground)]" : "text-[var(--color-muted-foreground)]"
              }`}
            >
              {label}
            </span>

            {/* Heures */}
            {slot.isActive ? (
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-[var(--color-muted-foreground)] shrink-0">De</label>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => update(index, { startTime: e.target.value })}
                    className="px-2 py-1 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-foreground)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-[var(--color-muted-foreground)] shrink-0">à</label>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => update(index, { endTime: e.target.value })}
                    className="px-2 py-1 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-foreground)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>
            ) : (
              <span className="text-xs text-[var(--color-muted-foreground)] italic">Fermé</span>
            )}
          </div>
        );
      })}

      {/* Feedback */}
      {status === "success" && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          ✓ Horaires enregistrés.
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          Une erreur est survenue. Réessayez.
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="w-full py-3 rounded-full font-medium text-white jam-gradient hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {isPending ? "Enregistrement…" : "Enregistrer les horaires"}
      </button>
    </div>
  );
}
