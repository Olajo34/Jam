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

type CommissionConfig = {
  commissionRate: number;
  proCommissionRate?: number;
  goldCommissionRate?: number;
};

export function getCommissionRate(
  plan: string | null | undefined,
  config: CommissionConfig,
): number {
  if (plan === "GOLD") return config.goldCommissionRate ?? 0.03;
  if (plan === "PRO") return config.proCommissionRate ?? 0.05;
  return config.commissionRate ?? 0.07;
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

// Coordonnées des centres-villes — zone CEMAC (Cameroun + capitales régionales)
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Douala:        { lat:  4.0511, lng:  9.7679 },
  Yaoundé:       { lat:  3.8480, lng: 11.5021 },
  Bafoussam:     { lat:  5.4737, lng: 10.4176 },
  Bamenda:       { lat:  5.9631, lng: 10.1591 },
  Garoua:        { lat:  9.3008, lng: 13.3978 },
  Maroua:        { lat: 10.5907, lng: 14.3147 },
  Ngaoundéré:    { lat:  7.3267, lng: 13.5840 },
  Bertoua:       { lat:  4.5788, lng: 13.6859 },
  Kribi:         { lat:  2.9391, lng:  9.9087 },
  Limbé:         { lat:  4.0233, lng:  9.2056 },
  Brazzaville:   { lat: -4.2634, lng: 15.2429 },
  Libreville:    { lat:  0.3901, lng:  9.4544 },
  "N'Djamena":   { lat: 12.1348, lng: 15.0557 },
  Bangui:        { lat:  4.3609, lng: 18.5582 },
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
