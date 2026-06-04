"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function GeolocationButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hasGeo = searchParams.has("lat");

  function handleGeolocate() {
    setError(null);
    if (!navigator.geolocation) {
      setError("Géolocalisation non supportée par votre navigateur.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", pos.coords.latitude.toFixed(6));
        params.set("lng", pos.coords.longitude.toFixed(6));
        params.delete("ville"); // ville filter overridden by coords
        startTransition(() => router.push(`${pathname}?${params.toString()}`));
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError("Accès à la position refusé. Activez la localisation dans votre navigateur.");
        } else {
          setError("Impossible d'obtenir votre position.");
        }
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }

  function handleReset() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("lat");
    params.delete("lng");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {hasGeo ? (
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
        >
          <span>📍</span>
          <span>Près de moi</span>
          <span className="text-white/70 hover:text-white ml-1" title="Désactiver">×</span>
        </button>
      ) : (
        <button
          onClick={handleGeolocate}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-[var(--color-border)] bg-white hover:bg-[var(--color-cream)] transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <span className="animate-spin">⟳</span>
          ) : (
            <span>📍</span>
          )}
          <span>{isPending ? "Localisation..." : "Près de moi"}</span>
        </button>
      )}
      {error && (
        <p className="text-xs text-red-500 max-w-xs">{error}</p>
      )}
    </div>
  );
}
