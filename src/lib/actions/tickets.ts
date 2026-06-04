"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function checkModerator() {
  const session = await auth();
  if (!session || !["MODERATEUR", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function replyToTicket(ticketId: string, body: string) {
  const session = await checkModerator();

  await prisma.$transaction([
    prisma.ticketMessage.create({
      data: { ticketId, senderId: session.user.id, body },
    }),
    prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "IN_PROGRESS", assignedTo: session.user.id },
    }),
  ]);

  revalidatePath(`/moderateur/tickets/${ticketId}`);
  revalidatePath("/moderateur/tickets");
}

export async function closeTicket(ticketId: string) {
  await checkModerator();

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: "RESOLVED" },
  });

  revalidatePath("/moderateur/tickets");
}
