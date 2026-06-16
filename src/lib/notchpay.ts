import crypto from "crypto";

const API = "https://api.notchpay.co";

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
    headers: {
      Authorization: `Bearer ${process.env.NOTCHPAY_PUBLIC_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...params, currency: "XAF" }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "Erreur NotchPay");
  return data as { authorization_url: string; transaction: { reference: string } };
}

export async function verifyPayment(reference: string) {
  const res = await fetch(`${API}/payments/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.NOTCHPAY_SECRET_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Paiement introuvable");
  return res.json() as Promise<{ transaction: { status: string; channel?: string } }>;
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const hash = crypto
    .createHmac("sha256", process.env.NOTCHPAY_HASH!)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}
