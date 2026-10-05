import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const addMemberSchema = z.object({
  userId: z.string().min(1),
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
    const members = await prisma.groupMember.findMany({
      where: { groupId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            school: true,
            grade: true,
            level: true,
          },
        },
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("[GroupMembers] GET error:", error);
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
  const result = addMemberSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  try {
    // Check requester is admin/owner
    const requester = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: session.user.id } },
    });

    if (!requester || !["admin", "owner"].includes(requester.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check maxMembers
    if (group._count.members >= group.maxMembers) {
      return NextResponse.json(
        { error: "Group has reached maximum members" },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existing = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: id, userId: result.data.userId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User is already a member" },
        { status: 409 }
      );
    }

    const member = await prisma.$transaction(async (tx) => {
      const newMember = await tx.groupMember.create({
        data: {
          groupId: id,
          userId: result.data.userId,
          role: "member",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              school: true,
              grade: true,
              level: true,
            },
          },
        },
      });

      // Add to linked conversation
      if (group.conversationId) {
        await tx.conversationMember.create({
          data: {
            conversationId: group.conversationId,
            userId: result.data.userId,
            role: "member",
          },
        });
      }

      return newMember;
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("[GroupMembers] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
