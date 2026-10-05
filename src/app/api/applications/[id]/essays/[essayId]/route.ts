import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; essayId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, essayId } = await params;
  const application = await prisma.collegeApplication.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const wordCount = body.content ? body.content.trim().split(/\s+/).length : 0;

  const essay = await prisma.collegeEssay.update({
    where: { id: essayId },
    data: {
      prompt: body.prompt,
      content: body.content,
      wordLimit: body.wordLimit,
      wordCount,
    },
  });

  return NextResponse.json(essay);
}
