import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/verifier-email?error=missing", req.url));

  const record = await prisma.verificationToken.findFirst({ where: { token } });

  if (!record) return NextResponse.redirect(new URL("/verifier-email?error=invalid", req.url));
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { identifier_token: { identifier: record.identifier, token } } });
    return NextResponse.redirect(new URL("/verifier-email?error=expired", req.url));
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier: record.identifier, token } },
    }),
  ]);

  return NextResponse.redirect(new URL("/verifier-email?success=1", req.url));
}
