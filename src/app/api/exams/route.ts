import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const examSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200),
  date: z.string().min(1, "Date is required"),
  location: z.string().max(300).optional(),
  notes: z.string().max(5000).optional(),
  color: z.string().max(20).optional(),
  topics: z.array(z.string().max(200)).max(50).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const exams = await prisma.exam.findMany({
      where: { userId: session.user.id },
      include: { topics: true },
      orderBy: { date: "asc" },
      take: 100,
    });
    return NextResponse.json(exams);
  } catch (error) {
    console.error("[Exams] GET error:", error);
    return NextResponse.json({ error: "Failed to load exams" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = examSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid input", details: z.treeifyError(result.error) }, { status: 400 });
  }

  try {
    const { topics, date, ...data } = result.data;
    const exam = await prisma.exam.create({
      data: {
        ...data,
        userId: session.user.id,
        date: new Date(date),
        topics: topics?.length
          ? { create: topics.map((t) => ({ topic: t })) }
          : undefined,
      },
      include: { topics: true },
    });
    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    console.error("[Exams] POST error:", error);
    return NextResponse.json({ error: "Failed to create exam" }, { status: 500 });
  }
}
