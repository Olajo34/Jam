import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDepositStatus } from "@/lib/pawapay";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ depositId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { depositId } = await params;
  const status = await getDepositStatus(depositId);
  return NextResponse.json({ status: status.status });
}
