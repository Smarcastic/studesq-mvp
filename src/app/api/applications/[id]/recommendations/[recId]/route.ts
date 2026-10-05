import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; recId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recId } = await params;
  const existing = await prisma.recommendationLetter.findFirst({
    where: { id: recId, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const rec = await prisma.recommendationLetter.update({
    where: { id: recId },
    data: {
      teacherName: body.teacherName,
      subject: body.subject,
      requested: body.requested,
      confirmed: body.confirmed,
      submitted: body.submitted,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      notes: body.notes,
    },
  });

  return NextResponse.json(rec);
}
