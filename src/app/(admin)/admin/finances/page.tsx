import { prisma } from "@/lib/prisma";
import { formatFCFA } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  SUCCESS: "Payé", PENDING: "En attente", FAILED: "Échoué", REFUNDED: "Remboursé",
};
const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-600",
};

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page } = await searchParams;
  const pageNum = Math.max(1, Number(page ?? 1));
  const perPage = 20;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const where = status ? { status: status as "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED" } : {};

  const [payments, total, totals, monthlyTotals, subPayments] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: perPage,
      skip: (pageNum - 1) * perPage,
      include: {
        booking: {
          include: {
            user: { select: { name: true, email: true } },
            prestataire: { select: { businessName: true } },
            service: { select: { name: true } },
          },
        },
      },
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({ _sum: { amount: true, commission: true, prestataireNet: true } }),
    prisma.payment.aggregate({
      where: { status: "SUCCESS", createdAt: { gte: startOfMonth } },
      _sum: { amount: true, commission: true },
    }),
    prisma.subscriptionPayment.aggregate({ _sum: { amount: true } }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Finances</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">Transactions et commissions plateforme</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Volume total" value={formatFCFA(totals._sum.amount ?? 0)} sub="toutes transactions" />
        <SummaryCard label="Commissions totales" value={formatFCFA(totals._sum.commission ?? 0)} sub="revenus plateforme" highlight />
        <SummaryCard label="Volume ce mois" value={formatFCFA(monthlyTotals._sum.amount ?? 0)} sub="transactions réussies" />
        <SummaryCard label="Abonnements" value={formatFCFA(subPayments._sum.amount ?? 0)} sub="revenus abonnements" />
      </div>

      {/* Filter */}
      <form method="GET" className="flex gap-3">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="px-4 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button type="submit" className="px-4 py-2 text-sm rounded-xl bg-[var(--color-primary)] text-white hover:opacity-90">
          Filtrer
        </button>
        {status && (
          <a href="/admin/finances" className="px-4 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white hover:bg-[var(--color-cream)]">
            Effacer
          </a>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-cream)]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">Transaction</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">Prestataire</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">Montant</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">Commission</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">Statut</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[var(--color-muted-foreground)]">
                  Aucune transaction
                </td>
              </tr>
            )}
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-[var(--color-cream)]/50">
                <td className="px-5 py-3">
                  <p className="font-medium text-[var(--color-foreground)] truncate max-w-40">
                    {p.booking.user.name ?? p.booking.user.email}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{p.booking.service.name}</p>
                </td>
                <td className="px-5 py-3 text-[var(--color-muted-foreground)] truncate max-w-32">
                  {p.booking.prestataire.businessName}
                </td>
                <td className="px-5 py-3 text-right font-medium">{formatFCFA(p.amount)}</td>
                <td className="px-5 py-3 text-right text-emerald-700 font-medium">{formatFCFA(p.commission)}</td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-[var(--color-muted-foreground)]">
                  {p.createdAt.toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-[var(--color-muted-foreground)]">Page {pageNum} / {totalPages}</p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <a href={`/admin/finances?${new URLSearchParams({ ...(status ? { status } : {}), page: String(pageNum - 1) })}`}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] bg-white hover:bg-[var(--color-cream)]">
                ← Précédent
              </a>
            )}
            {pageNum < totalPages && (
              <a href={`/admin/finances?${new URLSearchParams({ ...(status ? { status } : {}), page: String(pageNum + 1) })}`}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] bg-white hover:bg-[var(--color-cream)]">
                Suivant →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "bg-[var(--color-primary)] border-transparent" : "bg-white border-[var(--color-border)]"}`}>
      <p className={`text-2xl font-display font-semibold ${highlight ? "text-white" : "text-[var(--color-foreground)]"}`}>
        {value}
      </p>
      <p className={`text-sm font-medium mt-0.5 ${highlight ? "text-white" : "text-[var(--color-foreground)]"}`}>{label}</p>
      <p className={`text-xs mt-0.5 ${highlight ? "text-white/70" : "text-[var(--color-muted-foreground)]"}`}>{sub}</p>
    </div>
  );
}
