import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const sendMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  type: z
    .enum(["text", "image", "poll", "quiz", "flashcard_share", "pomodoro_invite", "system"])
    .optional()
    .default("text"),
  metadata: z.string().optional(),
  replyToId: z.string().optional(),
});

const userSelect = {
  id: true,
  name: true,
  username: true,
  image: true,
} as const;

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
    // Verify user is a member
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this conversation" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 100);

    // Build where clause for cursor-based pagination
    const where: Record<string, unknown> = { conversationId: id };

    if (cursor) {
      const cursorMessage = await prisma.message.findUnique({
        where: { id: cursor },
        select: { createdAt: true },
      });

      if (cursorMessage) {
        where.createdAt = { lt: cursorMessage.createdAt };
      }
    }

    const messages = await prisma.message.findMany({
      where,
      take: limit + 1, // Fetch one extra to determine if there's a next page
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: userSelect },
        reactions: {
          include: {
            user: { select: userSelect },
          },
        },
      },
    });

    // Determine next cursor
    let nextCursor: string | null = null;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem!.id;
    }

    // Fetch reply-to info for messages that have replyToId
    const replyToIds = messages
      .filter((m) => m.replyToId)
      .map((m) => m.replyToId as string);

    let replyToMap: Record<string, { content: string | null; senderName: string | null }> = {};

    if (replyToIds.length > 0) {
      const replyMessages = await prisma.message.findMany({
        where: { id: { in: replyToIds } },
        select: {
          id: true,
          content: true,
          sender: { select: { name: true } },
        },
      });

      replyToMap = Object.fromEntries(
        replyMessages.map((m) => [
          m.id,
          { content: m.content, senderName: m.sender.name },
        ])
      );
    }

    const messagesWithReply = messages.map((m) => ({
      ...m,
      replyTo: m.replyToId ? replyToMap[m.replyToId] || null : null,
    }));

    return NextResponse.json({
      messages: messagesWithReply,
      nextCursor,
    });
  } catch (error) {
    console.error("[Messages] GET error:", error);
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
  const result = sendMessageSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  const { content, type, metadata, replyToId } = result.data;

  try {
    // Verify user is a member
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this conversation" },
        { status: 403 }
      );
    }

    const now = new Date();

    // Create message, update conversation lastMessageAt, and update sender's lastReadAt
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: id,
          senderId: session.user.id,
          content,
          type,
          metadata,
          replyToId,
        },
        include: {
          sender: { select: userSelect },
        },
      }),
      prisma.conversation.update({
        where: { id },
        data: { lastMessageAt: now },
      }),
      prisma.conversationMember.update({
        where: {
          conversationId_userId: {
            conversationId: id,
            userId: session.user.id,
          },
        },
        data: { lastReadAt: now, isTyping: false },
      }),
    ]);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("[Messages] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
