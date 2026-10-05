import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignmentSchema } from "@/lib/validations/assignment";
import { z } from "zod/v4";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const sort = searchParams.get("sort") || "dueDate-asc";

    const where: Record<string, unknown> = { userId: session.user.id };
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [sortField, sortDir] = sort.split("-");
    const orderBy: Record<string, string> = {};
    if (sortField === "dueDate") orderBy.dueDate = sortDir || "asc";
    else if (sortField === "priority") orderBy.priority = sortDir || "desc";
    else if (sortField === "title") orderBy.title = sortDir || "asc";
    else orderBy.createdAt = "desc";

    const assignments = await prisma.assignment.findMany({
      where,
      orderBy,
      take: 100,
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("[Assignments] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = assignmentSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  try {
    const { dueDate, ...data } = result.data;

    const assignment = await prisma.assignment.create({
      data: {
        ...data,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("[Assignments] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
