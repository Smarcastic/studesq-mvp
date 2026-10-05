import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";
import { getLevelForXP } from "@/lib/xp-system";

const applySchema = z.object({
  status: z.enum(["INTERESTED", "APPLIED", "REGISTERED", "ATTENDED", "WITHDREW"]),
  notes: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = applySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  const { status, notes } = result.data;

  try {
    // Find the event
    const event = await prisma.marketplaceEvent.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!event || event.status !== "APPROVED") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get existing application to detect first-time status transitions
    const existing = await prisma.marketplaceApplication.findUnique({
      where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
      select: { status: true },
    });

    // Upsert the application
    const application = await prisma.marketplaceApplication.upsert({
      where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
      create: {
        userId: session.user.id,
        eventId: event.id,
        status,
        notes: notes ?? null,
      },
      update: {
        status,
        notes: notes ?? null,
      },
    });

    // Award XP for first-time REGISTERED or ATTENDED
    const wasAlreadyRegistered = existing?.status === "REGISTERED" || existing?.status === "ATTENDED";
    const wasAlreadyAttended = existing?.status === "ATTENDED";

    if (status === "ATTENDED" && !wasAlreadyAttended) {
      // Award 25 XP for attending
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { xp: true },
      });
      const currentXP = currentUser?.xp ?? 0;
      const newXP = currentXP + 25;
      const newLevel = getLevelForXP(newXP);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: session.user.id },
          data: { xp: { increment: 25 }, level: newLevel.name },
        }),
        prisma.xPEvent.create({
          data: {
            userId: session.user.id,
            action: "marketplace_attend",
            xp: 25,
            meta: JSON.stringify({ eventId: event.id, slug }),
          },
        }),
      ]);
    } else if (status === "REGISTERED" && !wasAlreadyRegistered) {
      // Award 10 XP for registering
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { xp: true },
      });
      const currentXP = currentUser?.xp ?? 0;
      const newXP = currentXP + 10;
      const newLevel = getLevelForXP(newXP);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: session.user.id },
          data: { xp: { increment: 10 }, level: newLevel.name },
        }),
        prisma.xPEvent.create({
          data: {
            userId: session.user.id,
            action: "marketplace_register",
            xp: 10,
            meta: JSON.stringify({ eventId: event.id, slug }),
          },
        }),
      ]);
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("[Marketplace/apply] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
