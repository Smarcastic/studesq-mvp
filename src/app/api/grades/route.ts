import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gradeSchema } from "@/lib/validations/grade";
import { z } from "zod/v4";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const semester = searchParams.get("semester");

    const where: Record<string, unknown> = { userId: session.user.id };
    if (semester) where.semester = semester;

    const grades = await prisma.grade.findMany({
      where,
      orderBy: [{ semester: "desc" }, { subject: "asc" }],
      take: 100,
    });

    return NextResponse.json(grades);
  } catch (error) {
    console.error("[Grades] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = gradeSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  try {
    const grade = await prisma.grade.create({
      data: {
        ...result.data,
        userId: session.user.id,
      },
    });

    return NextResponse.json(grade, { status: 201 });
  } catch (error) {
    console.error("[Grades] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
