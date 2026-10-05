import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const group = await prisma.group.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (!group.isPublic) {
      return NextResponse.json(
        { error: "This group is not public" },
        { status: 403 }
      );
    }

    // Check not already a member
    const existing = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: id, userId: session.user.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You are already a member" },
        { status: 409 }
      );
    }

    // Check maxMembers
    if (group._count.members >= group.maxMembers) {
      return NextResponse.json(
        { error: "Group has reached maximum members" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.groupMember.create({
        data: {
          groupId: id,
          userId: session.user!.id,
          role: "member",
        },
      });

      // Add to linked conversation
      if (group.conversationId) {
        await tx.conversationMember.create({
          data: {
            conversationId: group.conversationId,
            userId: session.user!.id,
            role: "member",
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GroupJoin] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
