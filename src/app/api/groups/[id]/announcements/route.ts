import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  pinned: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const announcements = await prisma.groupAnnouncement.findMany({
      where: { groupId: id },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("[GroupAnnouncements] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await req.json();
  const result = createAnnouncementSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  try {
    // Check that user is admin, moderator, or owner
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: id, userId: session.user.id },
      },
    });

    if (
      !member ||
      !["admin", "moderator", "owner"].includes(member.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const announcement = await prisma.groupAnnouncement.create({
      data: {
        groupId: id,
        authorId: session.user.id,
        title: result.data.title,
        content: result.data.content,
        pinned: result.data.pinned ?? false,
      },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("[GroupAnnouncements] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
