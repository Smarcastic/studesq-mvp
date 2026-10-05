import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const essaySchema = z.object({
  prompt: z.string().max(1000).default(""),
  content: z.string().max(50000).default(""),
  wordLimit: z.number().int().min(0).max(100000).optional(),
  wordCount: z.number().int().min(0).max(100000).default(0),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const application = await prisma.collegeApplication.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const result = essaySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid input", details: z.treeifyError(result.error) }, { status: 400 });
  }

  try {
    const essay = await prisma.collegeEssay.create({
      data: { applicationId: id, ...result.data },
    });
    return NextResponse.json(essay, { status: 201 });
  } catch (error) {
    console.error("[Essays] POST error:", error);
    return NextResponse.json({ error: "Failed to create essay" }, { status: 500 });
  }
}
