import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { goalSchema } from "@/lib/validations/goal";
import { z } from "zod/v4";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const result = goalSchema.partial().safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  const existing = await prisma.goal.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { targetDate, milestones, ...data } = result.data;

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      ...data,
      ...(targetDate !== undefined ? { targetDate: targetDate ? new Date(targetDate) : null } : {}),
      ...(milestones !== undefined ? { milestones: JSON.stringify(milestones) } : {}),
      ...(data.status === "completed" ? { completedAt: new Date() } : {}),
    },
  });

  return NextResponse.json(goal);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.goal.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.goal.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
