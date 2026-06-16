"use client";

import { useState } from "react";

export default function UpgradeButton({
  plan,
  label,
  gold,
}: {
  plan: "PRO" | "GOLD";
  label: string;
  gold?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 ${
          gold ? "bg-amber-500" : "bg-[var(--color-primary)]"
        }`}
      >
        {loading ? "Redirection…" : `Passer à ${label}`}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
