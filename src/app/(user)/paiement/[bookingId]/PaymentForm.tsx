"use client";

import { useState } from "react";
import { formatFCFA } from "@/lib/utils";

const OPERATORS = [
  { id: "MTN",    label: "MTN Mobile Money",  flag: "🟡", zone: "Cameroun · Ghana · CI" },
  { id: "ORANGE", label: "Orange Money",       flag: "🟠", zone: "Cameroun · Sénégal · CI" },
  { id: "WAVE",   label: "Wave",               flag: "🔵", zone: "Côte d'Ivoire · Sénégal" },
  { id: "MOOV",   label: "Moov Money",         flag: "💙", zone: "Bénin · Burkina · Togo" },
];

export default function PaymentForm({
  bookingId,
  defaultPhone,
  amount,
}: {
  bookingId: string;
  defaultPhone: string;
  amount: number;
}) {
  const [phone, setPhone] = useState(defaultPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    setError("");
    if (!phone.trim()) {
      setError("Veuillez saisir votre numéro de téléphone mobile money.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de l'initialisation");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Numéro Mobile Money */}
      <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5 shadow-sm">
        <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-3">
          Numéro Mobile Money
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+237 6XX XXX XXX"
          className="input-base"
        />
        <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
          Le numéro lié à votre compte MTN, Orange, Wave ou Moov.
        </p>
      </div>

      {/* Opérateurs supportés */}
      <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-3">
          Opérateurs acceptés
        </p>
        <div className="grid grid-cols-2 gap-2">
          {OPERATORS.map((op) => (
            <div key={op.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]">
              <span className="text-lg">{op.flag}</span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--color-foreground)] truncate">{op.label}</p>
                <p className="text-[10px] text-[var(--color-muted-foreground)]">{op.zone}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-3">
          NotchPay détecte automatiquement votre opérateur selon le numéro saisi.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* CTA */}
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full py-4 rounded-full text-white font-semibold text-sm tracking-wide jam-gradient hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg shadow-[#4D1740]/20"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Redirection vers NotchPay…
          </span>
        ) : (
          `Payer ${formatFCFA(amount)} →`
        )}
      </button>

      <p className="text-xs text-center text-[var(--color-muted-foreground)]">
        🔒 Paiement sécurisé par NotchPay · Vous recevrez une confirmation par SMS
      </p>
    </div>
  );
}
