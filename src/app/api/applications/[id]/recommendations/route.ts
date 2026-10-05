import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const recommendationSchema = z.object({
  teacherName: z.string().min(1, "Teacher name is required").max(200),
  subject: z.string().max(200).optional(),
  deadline: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await params;

  const body = await req.json();
  const result = recommendationSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid input", details: z.treeifyError(result.error) }, { status: 400 });
  }

  try {
    const { deadline, ...data } = result.data;
    const rec = await prisma.recommendationLetter.create({
      data: {
        ...data,
        userId: session.user.id,
        deadline: deadline ? new Date(deadline) : null,
      },
    });
    return NextResponse.json(rec, { status: 201 });
  } catch (error) {
    console.error("[Recommendations] POST error:", error);
    return NextResponse.json({ error: "Failed to create recommendation" }, { status: 500 });
  }
}
