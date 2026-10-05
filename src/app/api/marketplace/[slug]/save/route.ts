import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLevelForXP } from "@/lib/xp-system";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    // Find the event
    const event = await prisma.marketplaceEvent.findUnique({
      where: { slug },
      select: { id: true, status: true, saveCount: true },
    });

    if (!event || event.status !== "APPROVED") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check for existing save
    const existing = await prisma.marketplaceSave.findUnique({
      where: {
        userId_eventId: { userId: session.user.id, eventId: event.id },
      },
    });

    if (existing) {
      // Unsave: delete save record + decrement saveCount
      await prisma.$transaction([
        prisma.marketplaceSave.delete({
          where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
        }),
        prisma.marketplaceEvent.update({
          where: { id: event.id },
          data: { saveCount: { decrement: 1 } },
        }),
      ]);

      return NextResponse.json({ saved: false });
    } else {
      // Save: create save record + increment saveCount + award 2 XP
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { xp: true },
      });
      const currentXP = currentUser?.xp ?? 0;
      const newXP = currentXP + 2;
      const newLevel = getLevelForXP(newXP);

      await prisma.$transaction([
        prisma.marketplaceSave.create({
          data: { userId: session.user.id, eventId: event.id },
        }),
        prisma.marketplaceEvent.update({
          where: { id: event.id },
          data: { saveCount: { increment: 1 } },
        }),
        prisma.user.update({
          where: { id: session.user.id },
          data: { xp: { increment: 2 }, level: newLevel.name },
        }),
        prisma.xPEvent.create({
          data: {
            userId: session.user.id,
            action: "marketplace_save",
            xp: 2,
            meta: JSON.stringify({ eventId: event.id, slug }),
          },
        }),
      ]);

      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error("[Marketplace/save] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
