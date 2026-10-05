import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; topicId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, topicId } = await params;

  // Verify exam ownership
  const exam = await prisma.exam.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!exam) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Verify topic belongs to this exam
  const existing = await prisma.revisionTopic.findFirst({
    where: { id: topicId, examId: id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Topic not found in this exam" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const isComplete = body.isComplete === true;

    const topic = await prisma.revisionTopic.update({
      where: { id: topicId },
      data: { isComplete },
    });

    return NextResponse.json(topic);
  } catch (error) {
    console.error("[ExamTopic] PUT error:", error);
    return NextResponse.json({ error: "Failed to update topic" }, { status: 500 });
  }
}
