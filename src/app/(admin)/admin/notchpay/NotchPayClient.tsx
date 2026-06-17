"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  actionCreateCustomer,
  actionDeleteCustomer,
  actionCreateWebhook,
  actionDeleteWebhook,
} from "./actions";
import type { NotchPayCustomer, NotchPayWebhook } from "@/lib/notchpay";

// ── Customer form ─────────────────────────────────────────────────────────────

export function NewCustomerForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await actionCreateCustomer(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        + Nouveau client
      </button>
    );
  }

  return (
    <div className="bg-[var(--color-cream)] rounded-2xl border border-[var(--color-border)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[var(--color-foreground)]">Nouveau client NotchPay</h3>
        <button onClick={() => setOpen(false)} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">✕</button>
      </div>
      <form action={submit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <input name="name" required placeholder="Nom complet *" className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          <input name="email" type="email" required placeholder="Email *" className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          <input name="phone" placeholder="Téléphone" className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          <input name="description" placeholder="Description / Notes" className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {pending ? "Création..." : "Créer le client"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm hover:bg-white transition-colors">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Customer row actions ───────────────────────────────────────────────────────

export function CustomerActions({ customer }: { customer: NotchPayCustomer }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function del() {
    if (!confirm(`Supprimer le client ${customer.name} ?`)) return;
    startTransition(async () => {
      await actionDeleteCustomer(customer.id);
      router.refresh();
    });
  }

  return (
    <button
      onClick={del}
      disabled={pending}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
    >
      {pending ? "..." : "Supprimer"}
    </button>
  );
}

// ── Webhook form ──────────────────────────────────────────────────────────────

const DEFAULT_EVENTS = [
  "payment.created", "payment.complete", "payment.failed", "payment.expired",
  "transfer.complete", "transfer.failed", "balance.updated",
  "customer.created", "customer.updated",
];

export function NewWebhookForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await actionCreateWebhook(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        + Nouveau webhook
      </button>
    );
  }

  return (
    <div className="bg-[var(--color-cream)] rounded-2xl border border-[var(--color-border)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[var(--color-foreground)]">Nouveau webhook</h3>
        <button onClick={() => setOpen(false)} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">✕</button>
      </div>
      <form action={submit} className="space-y-3">
        <input
          name="url"
          required
          placeholder="URL de destination (https://...)"
          className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        <input
          name="description"
          placeholder="Description (optionnel)"
          className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        <input
          name="events"
          defaultValue={DEFAULT_EVENTS.join(", ")}
          placeholder="Événements (séparés par virgule)"
          className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Événements séparés par des virgules. Laisser par défaut pour les événements standards.
        </p>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {pending ? "Création..." : "Créer"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm hover:bg-white transition-colors">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Webhook row actions ────────────────────────────────────────────────────────

export function WebhookActions({ webhook }: { webhook: NotchPayWebhook }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function del() {
    if (!confirm(`Supprimer le webhook ${webhook.id} ?`)) return;
    startTransition(async () => {
      await actionDeleteWebhook(webhook.id);
      router.refresh();
    });
  }

  return (
    <button
      onClick={del}
      disabled={pending}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
    >
      {pending ? "..." : "Supprimer"}
    </button>
  );
}
