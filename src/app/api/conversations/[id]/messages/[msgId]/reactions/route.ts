import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const reactionSchema = z.object({
  emoji: z.string().min(1, "Emoji is required"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; msgId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, msgId } = await params;

  const body = await req.json();
  const result = reactionSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  const { emoji } = result.data;

  try {
    // Verify user is a member of the conversation
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

    // Verify message exists in this conversation
    const message = await prisma.message.findFirst({
      where: { id: msgId, conversationId: id },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Check if reaction already exists (toggle behavior)
    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId: msgId,
          userId: session.user.id,
          emoji,
        },
      },
    });

    if (existingReaction) {
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id },
      });

      return NextResponse.json({ added: false, emoji });
    }

    await prisma.messageReaction.create({
      data: {
        messageId: msgId,
        userId: session.user.id,
        emoji,
      },
    });

    return NextResponse.json({ added: true, emoji });
  } catch (error) {
    console.error("[Reactions] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
