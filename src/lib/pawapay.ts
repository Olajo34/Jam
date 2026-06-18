const BASE_URL = process.env.PAWAPAY_BASE_URL ?? "https://api.sandbox.pawapay.cloud";

function headers() {
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
  const res = await fetch(`${BASE_URL}/deposits`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PawaPay deposit failed (${res.status}): ${err}`);
  }
  return res.json();
}

export async function getDepositStatus(depositId: string): Promise<DepositStatus> {
  const res = await fetch(`${BASE_URL}/deposits/${depositId}`, { headers: headers() });
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
  // Orange: 655, 656, 690-699
  if (prefix === 655 || prefix === 656 || (prefix >= 690 && prefix <= 699)) {
    return "ORANGE_CMR";
  }
  return "MTN_MOMO_CMR";
}
