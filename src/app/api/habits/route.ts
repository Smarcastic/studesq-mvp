import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const createSchema = z.object({
  title: z.string().min(1).max(100),
  emoji: z.string().max(10).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const habits = await prisma.habit.findMany({
      where: { userId: session.user.id },
      include: {
        logs: {
          where: { date: { gte: thirtyDaysAgo } },
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json(habits);
  } catch (error) {
    console.error("[Habits] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = createSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Invalid input", details: z.treeifyError(result.error) }, { status: 400 });

  try {
    const habit = await prisma.habit.create({
      data: { ...result.data, userId: session.user.id },
      include: { logs: true },
    });

    return NextResponse.json(habit, { status: 201 });
  } catch (error) {
    console.error("[Habits] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
