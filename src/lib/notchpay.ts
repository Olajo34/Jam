import crypto from "crypto";

const API = "https://api.notchpay.co";

function pubHeaders() {
  return {
    Authorization: process.env.NOTCHPAY_PUBLIC_KEY!,
    "Content-Type": "application/json",
  };
}

function privHeaders() {
  return {
    Authorization: process.env.NOTCHPAY_PUBLIC_KEY!,
    "X-Grant": process.env.NOTCHPAY_SECRET_KEY!,
    "Content-Type": "application/json",
  };
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function initializePayment(params: {
  reference: string;
  amount: number;
  email: string;
  phone?: string;
  description: string;
  callback: string;
  redirect: string;
}) {
  const res = await fetch(`${API}/payments`, {
    method: "POST",
    headers: pubHeaders(),
    body: JSON.stringify({ ...params, currency: "XAF" }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "Erreur NotchPay");
  return data as { authorization_url: string; transaction: { reference: string } };
}

export async function verifyPayment(reference: string) {
  const res = await fetch(`${API}/payments/${reference}`, {
    headers: privHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Paiement introuvable");
  return res.json() as Promise<{ transaction: { status: string; amount?: number; channel?: string } }>;
}

export async function listPayments(page = 1, perPage = 20) {
  const res = await fetch(`${API}/payments?page=${page}&per_page=${perPage}`, {
    headers: pubHeaders(),
    cache: "no-store",
  });
  const data = await res.json();
  return data as {
    totals: number;
    last_page: number;
    current_page: number;
    items: NotchPayTransaction[];
  };
}

// ── Balance ───────────────────────────────────────────────────────────────────

export async function getBalance() {
  const res = await fetch(`${API}/balance`, {
    headers: privHeaders(),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "Erreur balance");
  return data.balance as {
    available: number;
    pending: number;
    reserved: number;
    total: number;
    credit: number;
    currency: string;
    environment: string;
  };
}

// ── Customers ─────────────────────────────────────────────────────────────────

export async function listCustomers(page = 1, perPage = 20, search?: string) {
  const url = new URL(`${API}/customers`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(perPage));
  if (search) url.searchParams.set("search", search);

  const res = await fetch(url.toString(), {
    headers: pubHeaders(),
    cache: "no-store",
  });
  const data = await res.json();
  return data as {
    totals: number;
    last_page: number;
    current_page: number;
    items: NotchPayCustomer[];
  };
}

export async function createCustomer(params: {
  email: string;
  name: string;
  phone?: string;
  description?: string;
}) {
  const res = await fetch(`${API}/customers`, {
    method: "POST",
    headers: pubHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "Erreur création client");
  return data.customer as NotchPayCustomer;
}

export async function updateCustomer(
  id: string,
  params: Partial<{ email: string; name: string; phone: string; description: string }>
) {
  const res = await fetch(`${API}/customers/${id}`, {
    method: "PUT",
    headers: pubHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "Erreur mise à jour client");
  return data;
}

export async function deleteCustomer(id: string) {
  const res = await fetch(`${API}/customers/${id}`, {
    method: "DELETE",
    headers: pubHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.message ?? "Erreur suppression client");
  }
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

export async function listWebhooks() {
  const res = await fetch(`${API}/webhooks`, {
    headers: privHeaders(),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "Erreur webhooks");
  return (data.endpoints ?? data.items ?? []) as NotchPayWebhook[];
}

export async function createWebhook(params: {
  url: string;
  description?: string;
  events: string[];
}) {
  const res = await fetch(`${API}/webhooks`, {
    method: "POST",
    headers: privHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "Erreur création webhook");
  return data;
}

export async function deleteWebhook(id: string) {
  const res = await fetch(`${API}/webhooks/${id}`, {
    method: "DELETE",
    headers: privHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.message ?? "Erreur suppression webhook");
  }
}

// ── Webhook signature ─────────────────────────────────────────────────────────

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const hash = crypto
    .createHmac("sha256", process.env.NOTCHPAY_HASH!)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotchPayTransaction = {
  reference: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  channel: string;
  customer?: { email: string; name?: string };
  created_at: string;
};

export type NotchPayCustomer = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  description?: string;
  created_at: string;
  updated_at: string;
};

export type NotchPayWebhook = {
  id: string;
  url: string | null;
  description: string | null;
  events: string[];
  status: string | null;
  sandbox: boolean;
  created_at: string;
  updated_at: string;
};
