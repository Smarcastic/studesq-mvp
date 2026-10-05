import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const applicationSchema = z.object({
  collegeName: z.string().min(1, "College name is required").max(300),
  programName: z.string().max(300).optional(),
  applicationUrl: z.string().max(2000).optional(),
  deadline: z.string().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "ACCEPTED", "REJECTED", "WAITLISTED"]).default("NOT_STARTED"),
  notes: z.string().max(5000).optional(),
  isEarlyDecision: z.boolean().default(false),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const applications = await prisma.collegeApplication.findMany({
      where: { userId: session.user.id },
      include: { essays: true },
      orderBy: { deadline: "asc" },
      take: 100,
    });
    return NextResponse.json(applications);
  } catch (error) {
    console.error("[Applications] GET error:", error);
    return NextResponse.json({ error: "Failed to load applications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = applicationSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid input", details: z.treeifyError(result.error) }, { status: 400 });
  }

  try {
    const { deadline, ...data } = result.data;
    const application = await prisma.collegeApplication.create({
      data: {
        ...data,
        userId: session.user.id,
        deadline: deadline ? new Date(deadline) : null,
      },
      include: { essays: true },
    });
    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("[Applications] POST error:", error);
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
  }
}
