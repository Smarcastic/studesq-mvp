import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const createConversationSchema = z.object({
  type: z.enum(["dm", "group"]),
  memberIds: z.array(z.string()).min(1, "At least one member required"),
  name: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: { userId: session.user.id },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
                lastSeenAt: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("[Conversations] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = createConversationSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  const { type, memberIds, name } = result.data;

  try {
    if (type === "dm") {
      if (memberIds.length !== 1) {
        return NextResponse.json(
          { error: "DM requires exactly one other member" },
          { status: 400 }
        );
      }

      const otherUserId = memberIds[0];

      if (otherUserId === session.user.id) {
        return NextResponse.json(
          { error: "Cannot create a DM with yourself" },
          { status: 400 }
        );
      }

      // Check for existing DM between these two users
      const existingDm = await prisma.conversation.findFirst({
        where: {
          type: "dm",
          AND: [
            { members: { some: { userId: session.user.id } } },
            { members: { some: { userId: otherUserId } } },
          ],
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                  lastSeenAt: true,
                },
              },
            },
          },
        },
      });

      if (existingDm) {
        return NextResponse.json(existingDm);
      }

      const conversation = await prisma.conversation.create({
        data: {
          type: "dm",
          members: {
            create: [
              { userId: session.user.id, role: "member" },
              { userId: otherUserId, role: "member" },
            ],
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                  lastSeenAt: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json(conversation, { status: 201 });
    }

    // Group conversation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    if (memberIds.length < 1) {
      return NextResponse.json(
        { error: "At least one other member is required for a group" },
        { status: 400 }
      );
    }

    // Filter out self from memberIds if included
    const otherMemberIds = memberIds.filter((id) => id !== session.user.id);

    const conversation = await prisma.conversation.create({
      data: {
        type: "group",
        name: name.trim(),
        createdBy: session.user.id,
        members: {
          create: [
            { userId: session.user.id, role: "owner" },
            ...otherMemberIds.map((userId) => ({
              userId,
              role: "member" as const,
            })),
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
                lastSeenAt: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("[Conversations] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
