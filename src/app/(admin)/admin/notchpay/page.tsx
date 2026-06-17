import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getBalance,
  listPayments,
  listCustomers,
  listWebhooks,
} from "@/lib/notchpay";
import { formatFCFA } from "@/lib/utils";
import {
  NewCustomerForm,
  CustomerActions,
  NewWebhookForm,
  WebhookActions,
} from "./NotchPayClient";

export default async function AdminNotchPayPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; q?: string }>;
}) {
  const { tab = "transactions", page: pageStr, q } = await searchParams;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/connexion");

  const currentPage = Number(pageStr ?? 1);

  // Fetch in parallel — gracefully handle errors
  const [balance, payments, customers, webhooks] = await Promise.allSettled([
    getBalance(),
    listPayments(currentPage, 20),
    listCustomers(1, 50, q ?? undefined),
    listWebhooks(),
  ]);

  const bal = balance.status === "fulfilled" ? balance.value : null;
  const pays = payments.status === "fulfilled" ? payments.value : null;
  const custs = customers.status === "fulfilled" ? customers.value : null;
  const hooks = webhooks.status === "fulfilled" ? webhooks.value : null;

  const env = bal?.environment ?? "sandbox";
  const isSandbox = env === "sandbox";

  const TABS = [
    { key: "transactions", label: "Transactions" },
    { key: "clients", label: `Clients (${custs?.totals ?? 0})` },
    { key: "webhooks", label: `Webhooks (${Array.isArray(hooks) ? hooks.length : 0})` },
  ];

  const STATUS_COLORS: Record<string, string> = {
    complete: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
    pending: "bg-amber-100 text-amber-700",
    processing: "bg-blue-100 text-blue-700",
    cancelled: "bg-gray-100 text-gray-500",
    expired: "bg-gray-100 text-gray-400",
  };

  return (
    <div className="space-y-6 pb-12">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">
              NotchPay
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isSandbox
                ? "bg-amber-100 text-amber-700 border-amber-200"
                : "bg-emerald-100 text-emerald-700 border-emerald-200"
            }`}>
              {isSandbox ? "Sandbox" : "Production"}
            </span>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
            Paiements, clients et webhooks
          </p>
        </div>
        {isSandbox && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700 max-w-xs">
            <strong>Mode test actif.</strong> Pour passer en production, mettez à jour les clés
            NotchPay dans les variables d&apos;environnement Vercel.
          </div>
        )}
      </div>

      {/* Solde */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Disponible", value: bal?.available, color: "text-emerald-600" },
          { label: "En attente", value: bal?.pending, color: "text-amber-600" },
          { label: "Réservé", value: bal?.reserved, color: "text-blue-600" },
          { label: "Total", value: bal?.total, color: "text-[var(--color-foreground)]" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)] mb-1">
              {item.label}
            </p>
            <p className={`text-2xl font-display font-bold ${item.color}`}>
              {item.value != null ? formatFCFA(item.value) : "—"}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--color-cream)] rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <a
            key={t.key}
            href={`/admin/notchpay?tab=${t.key}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-[var(--color-foreground)] shadow-sm"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* ── Tab: Transactions ── */}
      {tab === "transactions" && (
        <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-[var(--color-foreground)]">Transactions</h2>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {pays?.totals ?? 0} transaction{(pays?.totals ?? 0) > 1 ? "s" : ""} au total
              </p>
            </div>
          </div>
          {!pays || pays.items.length === 0 ? (
            <div className="text-center py-16 text-[var(--color-muted-foreground)]">
              <p className="text-4xl mb-3">💳</p>
              <p className="text-sm">Aucune transaction pour le moment.</p>
              {isSandbox && (
                <p className="text-xs mt-1 text-amber-600">
                  En mode sandbox, les transactions de test apparaissent ici.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-cream)]">
                    {["Référence", "Client", "Montant", "Canal", "Statut", "Date"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {pays.items.map((t) => (
                    <tr key={t.reference} className="hover:bg-[var(--color-cream)]/40 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-[var(--color-muted-foreground)]">
                        {t.reference}
                      </td>
                      <td className="px-5 py-3">
                        {t.customer ? (
                          <div>
                            <p className="text-sm font-medium">{t.customer.name || "—"}</p>
                            <p className="text-xs text-[var(--color-muted-foreground)]">{t.customer.email}</p>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-3 font-semibold">
                        {formatFCFA(t.amount)}
                      </td>
                      <td className="px-5 py-3 text-xs text-[var(--color-muted-foreground)] uppercase">
                        {t.channel || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_COLORS[t.status] ?? "bg-gray-100 text-gray-600"
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-[var(--color-muted-foreground)]">
                        {new Date(t.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
          {pays && pays.last_page > 1 && (
            <div className="px-6 py-3 border-t border-[var(--color-border)] flex items-center justify-between text-sm">
              <p className="text-[var(--color-muted-foreground)]">
                Page {pays.current_page} / {pays.last_page}
              </p>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <a href={`/admin/notchpay?tab=transactions&page=${currentPage - 1}`}
                    className="px-3 py-1 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-cream)] transition-colors">
                    ← Précédent
                  </a>
                )}
                {currentPage < pays.last_page && (
                  <a href={`/admin/notchpay?tab=transactions&page=${currentPage + 1}`}
                    className="px-3 py-1 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-cream)] transition-colors">
                    Suivant →
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Clients ── */}
      {tab === "clients" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <form method="GET" className="flex gap-2">
              <input type="hidden" name="tab" value="clients" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Rechercher par email..."
                className="px-4 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-56"
              />
              <button type="submit" className="px-4 py-2 text-sm rounded-xl bg-[var(--color-primary)] text-white hover:opacity-90">
                Chercher
              </button>
            </form>
            <NewCustomerForm />
          </div>

          <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
            {!custs || custs.items.length === 0 ? (
              <div className="text-center py-16 text-[var(--color-muted-foreground)]">
                <p className="text-4xl mb-3">👤</p>
                <p className="text-sm">Aucun client NotchPay.</p>
                <p className="text-xs mt-1">Créez un client pour lui envoyer des paiements ou des factures.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-cream)]">
                      {["Nom", "Email", "Téléphone", "Description", "Créé le", ""].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {custs.items.map((c) => (
                      <tr key={c.id} className="hover:bg-[var(--color-cream)]/40 transition-colors">
                        <td className="px-5 py-3 font-medium text-[var(--color-foreground)]">{c.name}</td>
                        <td className="px-5 py-3 text-[var(--color-muted-foreground)]">{c.email}</td>
                        <td className="px-5 py-3 text-[var(--color-muted-foreground)]">{c.phone || "—"}</td>
                        <td className="px-5 py-3 text-xs text-[var(--color-muted-foreground)] max-w-[200px] truncate">{c.description || "—"}</td>
                        <td className="px-5 py-3 text-xs text-[var(--color-muted-foreground)]">
                          {new Date(c.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-5 py-3">
                          <CustomerActions customer={c} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Webhooks ── */}
      {tab === "webhooks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Les webhooks reçoivent les événements NotchPay en temps réel.
                {isSandbox && " En sandbox, l'URL ne reçoit pas les événements réels."}
              </p>
            </div>
            <NewWebhookForm />
          </div>

          {!hooks || !Array.isArray(hooks) || hooks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[var(--color-border)] text-center py-16 text-[var(--color-muted-foreground)]">
              <p className="text-4xl mb-3">🔔</p>
              <p className="text-sm">Aucun webhook configuré.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hooks.map((w) => (
                <div key={w.id} className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${
                          w.status === "active" ? "bg-emerald-500" : "bg-gray-300"
                        }`} />
                        <p className="font-medium text-sm text-[var(--color-foreground)]">
                          {w.description || w.id}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                          w.sandbox
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : "bg-emerald-50 text-emerald-600 border-emerald-200"
                        }`}>
                          {w.sandbox ? "Sandbox" : "Live"}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-[var(--color-muted-foreground)] mb-1">
                        {w.id}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)] mb-2">
                        URL : {w.url ?? <span className="italic text-amber-600">Non configurée</span>}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {w.events.slice(0, 6).map((e) => (
                          <span key={e} className="px-2 py-0.5 bg-[var(--color-cream)] border border-[var(--color-border)] rounded-md text-xs font-mono text-[var(--color-muted-foreground)]">
                            {e}
                          </span>
                        ))}
                        {w.events.length > 6 && (
                          <span className="px-2 py-0.5 bg-[var(--color-cream)] border border-[var(--color-border)] rounded-md text-xs text-[var(--color-muted-foreground)]">
                            +{w.events.length - 6}
                          </span>
                        )}
                      </div>
                    </div>
                    <WebhookActions webhook={w} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
