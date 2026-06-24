import { createSign, randomUUID } from "crypto";

const BASE_URL = process.env.PAWAPAY_BASE_URL ?? "https://api.sandbox.pawapay.cloud";
const KEY_ID = process.env.PAWAPAY_KEY_ID ?? "jam-1";

function getPrivateKey(): string | null {
  const raw = process.env.PAWAPAY_PRIVATE_KEY;
  if (!raw) return null;
  return raw.replace(/\|/g, "\n");
}

function signBody(body: string): Record<string, string> {
  const pem = getPrivateKey();
  if (!pem) return {};

  const digest = Buffer.from(
    require("crypto").createHash("sha256").update(body).digest()
  ).toString("base64");

  const created = Math.floor(Date.now() / 1000);
  const signingString = `(request-target): post /deposits\ndigest: SHA-256=${digest}\nx-timestamp: ${created}`;

  const sign = createSign("SHA256");
  sign.update(signingString);
  sign.end();
  const sig = sign.sign({ key: pem, dsaEncoding: "ieee-p1363" }, "base64");

  return {
    Digest: `SHA-256=${digest}`,
    "X-Timestamp": String(created),
    Signature: `keyId="${KEY_ID}",algorithm="ecdsa-p256-sha256",headers="(request-target) digest x-timestamp",signature="${sig}"`,
  };
}

function baseHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.PAWAPAY_API_TOKEN}`,
  };
}

export type Correspondent = "MTN_MOMO_CMR" | "ORANGE_CMR";

export interface DepositRequest {
  depositId: string;
  amount: string;
  currency: "XAF";
  correspondent: Correspondent;
  payer: { type: "MSISDN"; address: { value: string } };
  customerTimestamp: string;
  statementDescription: string;
}

export interface DepositResponse {
  depositId: string;
  status: "ACCEPTED" | "REJECTED" | "DUPLICATE_IGNORED";
  reason?: { code: string; message: string };
}

export interface DepositStatus {
  depositId: string;
  status: "ACCEPTED" | "COMPLETED" | "FAILED" | "DUPLICATE_IGNORED";
  amount: string;
  currency: string;
  correspondent: string;
  payer: { type: string; address: { value: string } };
  statementDescription: string;
  created: string;
  depositedTimestamp?: string;
  reason?: { code: string; message: string };
}

export async function initiateDeposit(req: DepositRequest): Promise<DepositResponse> {
  const body = JSON.stringify(req);
  const res = await fetch(`${BASE_URL}/deposits`, {
    method: "POST",
    headers: { ...baseHeaders(), ...signBody(body) },
    body,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PawaPay deposit failed (${res.status}): ${err}`);
  }
  return res.json();
}

export async function getDepositStatus(depositId: string): Promise<DepositStatus> {
  const res = await fetch(`${BASE_URL}/deposits/${depositId}`, { headers: baseHeaders() });
  if (!res.ok) throw new Error(`PawaPay getDeposit failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

export function normalizeMsisdn(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("237")) return digits;
  if (digits.startsWith("0")) return `237${digits.slice(1)}`;
  return `237${digits}`;
}

export function detectCorrespondent(phone: string): Correspondent {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("237") ? digits.slice(3) : digits;
  const prefix = parseInt(local.slice(0, 3), 10);
  if (prefix === 655 || prefix === 656 || (prefix >= 690 && prefix <= 699)) {
    return "ORANGE_CMR";
  }
  return "MTN_MOMO_CMR";
}

export { randomUUID };
