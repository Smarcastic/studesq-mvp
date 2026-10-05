import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const application = await prisma.collegeApplication.findFirst({
    where: { id, userId: session.user.id },
    include: { essays: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(application);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.collegeApplication.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const application = await prisma.collegeApplication.update({
    where: { id },
    data: {
      collegeName: body.collegeName,
      programName: body.programName,
      applicationUrl: body.applicationUrl,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      status: body.status,
      notes: body.notes,
      isEarlyDecision: body.isEarlyDecision,
    },
    include: { essays: true },
  });

  return NextResponse.json(application);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.collegeApplication.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.collegeApplication.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
