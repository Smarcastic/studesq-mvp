import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";
import { XP_REWARDS, getLevelForXP } from "@/lib/xp-system";

const createSessionSchema = z.object({
  mode: z.enum(["pomodoro", "deep_focus", "stopwatch"]),
  duration: z.number().min(1).max(43200), // Max 12 hours
  subject: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  mood: z.string().max(50).optional(),
  focusScore: z.number().int().min(0).max(100).optional(),
  focusRating: z.number().int().min(0).max(5).optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

  try {
    const studySessions = await prisma.studySession.findMany({
      where: { userId: session.user.id },
      orderBy: { completedAt: "desc" },
      take: limit,
    });

    return NextResponse.json(studySessions);
  } catch (error) {
    console.error("Study sessions GET error:", error);
    return NextResponse.json({ error: "Failed to load sessions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = createSessionSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  try {
    const { focusRating, ...rest } = result.data;
    const userId = session.user.id;

    // Use a transaction to atomically create session + award XP
    const xpAction = rest.mode === "deep_focus" ? "deep_focus_session" : "study_session";
    const reward = XP_REWARDS[xpAction];

    const studySession = await prisma.$transaction(async (tx) => {
      // 1. Create the study session
      const newSession = await tx.studySession.create({
        data: {
          ...rest,
          userId,
          // Map focusRating (1-5) → distractions (0-4). Always populate when rating given.
          distractions: focusRating && focusRating > 0 ? Math.max(0, 5 - focusRating) : 0,
        },
      });

      // 2. Award XP atomically — read current XP inside the transaction to avoid race
      if (reward) {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { xp: true },
        });
        const newXP = (user?.xp || 0) + reward.xp;
        await Promise.all([
          tx.user.update({
            where: { id: userId },
            data: { xp: { increment: reward.xp }, level: getLevelForXP(newXP).name },
          }),
          tx.xPEvent.create({
            data: { userId, action: xpAction, xp: reward.xp },
          }),
        ]);
      }

      return newSession;
    });

    return NextResponse.json(studySession, { status: 201 });
  } catch (error) {
    console.error("Study session POST error:", error);
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}
