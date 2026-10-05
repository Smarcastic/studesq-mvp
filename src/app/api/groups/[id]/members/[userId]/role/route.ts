import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const updateRoleSchema = z.object({
  role: z.enum(["member", "moderator", "admin"]),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, userId } = await params;

  const body = await req.json();
  const result = updateRoleSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  try {
    // Only owner can change roles
    const requester = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: id, userId: session.user.id },
      },
    });

    if (!requester || requester.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Cannot change own role
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    // Check target member exists
    const targetMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });

    if (!targetMember) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    const updatedMember = await prisma.groupMember.update({
      where: { groupId_userId: { groupId: id, userId } },
      data: { role: result.data.role },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("[GroupMemberRole] PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
