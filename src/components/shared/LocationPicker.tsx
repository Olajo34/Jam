"use client";

import { useState } from "react";

export function LocationPicker() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  function detect() {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("ok");
      },
      () => setStatus("error"),
      { timeout: 8000 }
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[var(--color-foreground)]">
        Position GPS{" "}
        <span className="font-normal text-[var(--color-muted-foreground)]">(recommandé pour apparaître dans "Près de moi")</span>
      </label>

      {/* Hidden inputs transmitted with the form */}
      <input type="hidden" name="latitude"  value={coords?.lat ?? ""} />
      <input type="hidden" name="longitude" value={coords?.lng ?? ""} />

      <button
        type="button"
        onClick={detect}
        disabled={status === "loading"}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm w-fit transition-colors ${
          status === "ok"
            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : status === "error"
            ? "border-red-200 bg-red-50 text-red-600"
            : "border-[var(--color-border)] bg-[var(--color-cream)] hover:bg-white text-[var(--color-foreground)]"
        }`}
      >
        <span>{status === "loading" ? "⟳" : status === "ok" ? "✓" : "📍"}</span>
        {status === "idle"    && "Détecter ma position"}
        {status === "loading" && "Localisation en cours..."}
        {status === "ok"      && `Position enregistrée (${coords!.lat.toFixed(4)}, ${coords!.lng.toFixed(4)})`}
        {status === "error"   && "Erreur — réessayer"}
      </button>

      {status === "error" && (
        <p className="text-xs text-red-500">
          Impossible d'obtenir votre position. Vérifiez les permissions du navigateur.
        </p>
      )}
    </div>
  );
}
