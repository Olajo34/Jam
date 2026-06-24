"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatFCFA } from "@/lib/utils";

const OPERATORS = [
  { id: "MTN_MOMO_CMR", label: "Momo", flag: "🟡", hint: "65X, 67X, 68X" },
  { id: "ORANGE_CMR", label: "Orange Money", flag: "🟠", hint: "69X, 655, 656" },
];

export default function PaymentForm({
  bookingId,
  defaultPhone,
  amount,
  serviceName,
}: {
  bookingId: string;
  defaultPhone: string;
  amount: number;
  serviceName: string;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState(defaultPhone);
  const [correspondent, setCorrespondent] = useState<string>("MTN_MOMO_CMR");
  const [step, setStep] = useState<"form" | "waiting" | "success" | "failed">("form");
  const [depositId, setDepositId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handlePay() {
    setError("");
    if (!phone.trim()) {
      setError("Veuillez saisir votre numéro Mobile Money.");
      return;
    }
    setStep("waiting");

    try {
      const res = await fetch("/api/pawapay/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, phone: phone.trim(), correspondent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de l'initialisation");
      setDepositId(data.depositId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setStep("form");
    }
  }

  useEffect(() => {
    if (!depositId) return;
    let tries = 0;
    const interval = setInterval(async () => {
      tries++;
      if (tries > 24) { // 2 min max
        clearInterval(interval);
        setStep("failed");
        return;
      }
      try {
        const res = await fetch(`/api/pawapay/deposits/${depositId}`);
        const { status } = await res.json();
        if (status === "COMPLETED") {
          clearInterval(interval);
          setStep("success");
          setTimeout(() => router.push("/reservations"), 2500);
        } else if (status === "FAILED") {
          clearInterval(interval);
          setStep("failed");
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [depositId, router]);

  if (step === "success") {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-6xl">✅</div>
        <p className="text-xl font-semibold text-[var(--color-foreground)]">Paiement confirmé !</p>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Votre réservation est confirmée. Redirection en cours…
        </p>
      </div>
    );
  }

  if (step === "failed") {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-6xl">❌</div>
        <p className="text-xl font-semibold text-[var(--color-foreground)]">Paiement échoué</p>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Le paiement n'a pas abouti. Vérifiez votre solde et réessayez.
        </p>
        <button
          onClick={() => { setStep("form"); setDepositId(null); setError(""); }}
          className="px-6 py-2.5 rounded-full text-sm font-medium text-white jam-gradient hover:opacity-90"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (step === "waiting") {
    return (
      <div className="text-center py-12 space-y-5">
        <div className="text-6xl animate-pulse">📱</div>
        <p className="text-xl font-semibold text-[var(--color-foreground)]">En attente de confirmation</p>
        <p className="text-sm text-[var(--color-muted-foreground)] max-w-xs mx-auto">
          Une demande de paiement a été envoyée sur le{" "}
          <span className="font-medium">{phone}</span>. Confirmez sur votre téléphone pour valider.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--color-muted-foreground)]">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Vérification en cours…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Opérateur */}
      <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5 shadow-sm">
        <p className="text-sm font-semibold text-[var(--color-foreground)] mb-3">Opérateur Mobile Money</p>
        <div className="grid grid-cols-2 gap-2">
          {OPERATORS.map((op) => (
            <button
              key={op.id}
              onClick={() => setCorrespondent(op.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left ${
                correspondent === op.id
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                  : "border-[var(--color-border)] bg-[var(--color-background)]"
              }`}
            >
              <span className="text-xl">{op.flag}</span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--color-foreground)] truncate">{op.label}</p>
                <p className="text-[10px] text-[var(--color-muted-foreground)]">{op.hint}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Téléphone */}
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
          Le numéro lié à votre compte Mobile Money.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        onClick={handlePay}
        className="w-full py-4 rounded-full text-white font-semibold text-sm tracking-wide jam-gradient hover:opacity-90 transition-opacity shadow-lg shadow-[#4D1740]/20"
      >
        Payer {formatFCFA(amount)} →
      </button>

      <p className="text-xs text-center text-[var(--color-muted-foreground)]">
        🔒 Paiement sécurisé par PawaPay · Confirmation par notification téléphonique
      </p>
    </div>
  );
}
