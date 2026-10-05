import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const since = searchParams.get("since");

    if (!since) {
      return NextResponse.json(
        { error: "Missing 'since' query parameter" },
        { status: 400 }
      );
    }

    const sinceDate = new Date(since);

    if (isNaN(sinceDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid 'since' timestamp" },
        { status: 400 }
      );
    }

    // Fetch new messages since timestamp
    const messages = await prisma.message.findMany({
      where: {
        conversationId: id,
        createdAt: { gt: sinceDate },
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        reactions: {
          include: {
            user: {
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
    });

    // Fetch typing indicators — other members who are typing within last 5 seconds
    const fiveSecondsAgo = new Date(Date.now() - 5000);

    const typingMembers = await prisma.conversationMember.findMany({
      where: {
        conversationId: id,
        userId: { not: session.user.id },
        isTyping: true,
        typingAt: { gt: fiveSecondsAgo },
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    const typing = typingMembers
      .map((m) => m.user.name)
      .filter((name): name is string => name !== null);

    return NextResponse.json({ messages, typing });
  } catch (error) {
    console.error("[Poll] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
