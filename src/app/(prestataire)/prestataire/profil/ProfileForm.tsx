"use client";

import { useActionState, useState } from "react";
import { updatePrestataireProfile } from "@/lib/actions/prestataire";

type Props = {
  businessName: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

export default function ProfileForm(p: Props) {
  const [state, action, pending] = useActionState(updatePrestataireProfile, null);

  const [lat, setLat] = useState(p.latitude?.toString() ?? "");
  const [lng, setLng] = useState(p.longitude?.toString() ?? "");
  const [address, setAddress] = useState(p.address ?? "");
  const [city, setCity] = useState(p.city ?? "");
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleGeolocate() {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude.toString());
        setLng(longitude.toString());
        try {
          const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data.address) setAddress(data.address);
          if (data.city) setCity(data.city);
          setGeoStatus("done");
        } catch {
          setGeoStatus("done");
        }
      },
      () => setGeoStatus("error"),
      { timeout: 8000 },
    );
  }

  return (
    <form action={action} className="space-y-5">
      {/* Nom d'établissement */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="businessName" className="text-sm font-medium text-[var(--color-foreground)]">
          Nom d'établissement
        </label>
        <input
          id="businessName" name="businessName" type="text" required
          defaultValue={p.businessName}
          className="input-base"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-[var(--color-foreground)]">
          Description <span className="text-[var(--color-muted-foreground)] font-normal">(optionnel)</span>
        </label>
        <textarea
          id="description" name="description" rows={3}
          defaultValue={p.description ?? ""}
          placeholder="Décrivez votre activité, votre spécialité…"
          className="input-base resize-none"
        />
      </div>

      {/* Téléphone pro */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm font-medium text-[var(--color-foreground)]">
          Téléphone professionnel <span className="text-[var(--color-muted-foreground)] font-normal">(optionnel)</span>
        </label>
        <input
          id="phone" name="phone" type="tel"
          defaultValue={p.phone ?? ""}
          placeholder="+237 6XX XXX XXX"
          className="input-base"
        />
      </div>

      {/* Séparateur localisation */}
      <div className="pt-2 border-t border-[var(--color-border)]">
        <p className="text-sm font-semibold text-[var(--color-foreground)] mb-3">Localisation</p>

        {/* Bouton géolocalisation */}
        <button
          type="button"
          onClick={handleGeolocate}
          disabled={geoStatus === "loading"}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-white text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-cream)] transition-colors disabled:opacity-60 mb-4"
        >
          {geoStatus === "loading" ? (
            <svg className="animate-spin w-4 h-4 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          )}
          {geoStatus === "loading" ? "Localisation en cours…" : "Utiliser ma position actuelle"}
        </button>

        {geoStatus === "done" && (
          <p className="text-xs text-emerald-600 mb-3 font-medium">
            ✓ Position détectée — vérifiez et ajustez les champs ci-dessous si nécessaire.
          </p>
        )}
        {geoStatus === "error" && (
          <p className="text-xs text-red-500 mb-3">
            Géolocalisation impossible. Renseignez l'adresse manuellement.
          </p>
        )}

        {/* Coordonnées (hidden mais soumises) */}
        <input type="hidden" name="latitude" value={lat} />
        <input type="hidden" name="longitude" value={lng} />

        {lat && lng && (
          <p className="text-xs text-[var(--color-muted-foreground)] mb-3">
            Coordonnées : {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}
          </p>
        )}

        {/* Adresse */}
        <div className="flex flex-col gap-1.5 mb-3">
          <label htmlFor="address" className="text-sm font-medium text-[var(--color-foreground)]">
            Adresse
          </label>
          <input
            id="address" name="address" type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Rue, quartier…"
            className="input-base"
          />
        </div>

        {/* Ville */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="city" className="text-sm font-medium text-[var(--color-foreground)]">
            Ville
          </label>
          <input
            id="city" name="city" type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Abidjan, Douala, Dakar…"
            className="input-base"
          />
        </div>
      </div>

      {/* Feedback */}
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          ✓ Profil mis à jour avec succès.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 rounded-full font-medium text-white jam-gradient hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer le profil"}
      </button>
    </form>
  );
}
