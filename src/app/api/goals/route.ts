import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { goalSchema } from "@/lib/validations/goal";
import { z } from "zod/v4";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = { userId: session.user.id };
    if (status) where.status = status;
    if (category) where.category = category;

    const goals = await prisma.goal.findMany({
      where,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 100,
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error("[Goals] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = goalSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  try {
    const { targetDate, milestones, ...data } = result.data;

    const goal = await prisma.goal.create({
      data: {
        ...data,
        targetDate: targetDate ? new Date(targetDate) : null,
        milestones: milestones ? JSON.stringify(milestones) : null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("[Goals] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
