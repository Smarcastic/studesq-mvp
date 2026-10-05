import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;

  try {
    const group = await prisma.group.findUnique({
      where: { inviteCode: code },
      include: { _count: { select: { members: true } } },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    // Check not already a member
    const existing = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: group.id, userId: session.user.id },
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
          groupId: group.id,
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

    return NextResponse.json({
      id: group.id,
      name: group.name,
      description: group.description,
      type: group.type,
      school: group.school,
      avatarUrl: group.avatarUrl,
      isPublic: group.isPublic,
    });
  } catch (error) {
    console.error("[GroupJoinCode] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
