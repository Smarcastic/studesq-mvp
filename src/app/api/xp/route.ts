import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";
import { getLevelForXP, XP_REWARDS } from "@/lib/xp-system";

const awardSchema = z.object({
  action: z.string(),
  meta: z.string().optional(),
});

// GET — retrieve user XP, level, and recent XP events
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { xp: true, level: true },
    });

    const recentEvents = await prisma.xPEvent.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const level = getLevelForXP(user?.xp || 0);

    return NextResponse.json({
      xp: user?.xp || 0,
      level: level.name,
      levelInfo: level,
      recentEvents,
    });
  } catch (error) {
    console.error("XP GET error:", error);
    return NextResponse.json({ error: "Failed to load XP data" }, { status: 500 });
  }
}

// POST — award XP for an action
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = awardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  const { action, meta } = parsed.data;
  const reward = XP_REWARDS[action];
  if (!reward) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  try {
    // Use sequential reads then writes to avoid race condition
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { xp: true },
    });

    const currentXP = currentUser?.xp || 0;
    const newXP = currentXP + reward.xp;
    const newLevel = getLevelForXP(newXP);

    const [updatedUser, event] = await Promise.all([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          xp: { increment: reward.xp },
          level: newLevel.name,
        },
        select: { xp: true, level: true },
      }),
      prisma.xPEvent.create({
        data: {
          userId: session.user.id,
          action,
          xp: reward.xp,
          meta,
        },
      }),
    ]);

    return NextResponse.json({
      xpAwarded: reward.xp,
      totalXP: updatedUser.xp,
      level: updatedUser.level,
      event,
    });
  } catch (error) {
    console.error("XP POST error:", error);
    return NextResponse.json({ error: "Failed to award XP" }, { status: 500 });
  }
}
