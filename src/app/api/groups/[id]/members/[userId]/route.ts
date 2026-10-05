import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, userId } = await params;

  try {
    // Get the target member
    const targetMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });

    if (!targetMember) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Owner cannot be removed
    if (targetMember.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove the group owner" },
        { status: 403 }
      );
    }

    // Check permissions: admin/owner can remove others, members can only remove themselves
    const isSelf = userId === session.user.id;
    if (!isSelf) {
      const requester = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId: id, userId: session.user.id },
        },
      });

      if (!requester || !["admin", "owner"].includes(requester.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const group = await prisma.group.findUnique({
      where: { id },
      select: { conversationId: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.groupMember.delete({
        where: { groupId_userId: { groupId: id, userId } },
      });

      // Remove from linked conversation
      if (group?.conversationId) {
        await tx.conversationMember.deleteMany({
          where: {
            conversationId: group.conversationId,
            userId,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GroupMembers] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
