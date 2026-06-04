import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 0 }).format(amount) + " FCFA";
}

export function calculateCommission(amount: number, rate: number) {
  const commission = Math.round(amount * rate);
  return { commission, prestataireNet: amount - commission };
}

export function getMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Haversine formula — returns distance in km between two GPS points
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

// Approximate city centres in Côte d'Ivoire (and neighbouring capitals)
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Abidjan:       { lat:  5.3600, lng: -4.0083 },
  Bouaké:        { lat:  7.6900, lng: -5.0300 },
  Daloa:         { lat:  6.8750, lng: -6.4489 },
  "San-Pédro":   { lat:  4.7485, lng: -6.6363 },
  Yamoussoukro:  { lat:  6.8276, lng: -5.2893 },
  Korhogo:       { lat:  9.4578, lng: -5.6291 },
  Man:           { lat:  7.4126, lng: -7.5526 },
  Gagnoa:        { lat:  6.1319, lng: -5.9505 },
  Abengourou:    { lat:  6.7297, lng: -3.4964 },
  Divo:          { lat:  5.8375, lng: -5.3574 },
};

// Assign city-centre coords to a prestataire that has no explicit lat/lng
export function resolveCoords(
  lat: number | null,
  lng: number | null,
  city: string | null
): { lat: number; lng: number } | null {
  if (lat !== null && lng !== null) return { lat, lng };
  if (city && CITY_COORDS[city]) return CITY_COORDS[city];
  return null;
}

// Rank score: Gold = 0, Pro = 1, Free = 2 — lower is better (shown first)
export function planRank(plan?: string | null): number {
  if (plan === "GOLD") return 0;
  if (plan === "PRO") return 1;
  return 2;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
