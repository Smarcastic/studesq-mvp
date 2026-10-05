import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const pollVoteSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  optionIndex: z.number().int().min(0, "Option index must be non-negative"),
});

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
  const result = pollVoteSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  const { messageId, optionIndex } = result.data;

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

    // Find the message and verify it's a poll
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversationId: id,
        type: "poll",
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Poll message not found" },
        { status: 404 }
      );
    }

    if (!message.metadata) {
      return NextResponse.json(
        { error: "Poll has no metadata" },
        { status: 400 }
      );
    }

    // Parse metadata
    const metadata = JSON.parse(message.metadata) as {
      options: Array<{ text: string; votes: string[] }>;
      [key: string]: unknown;
    };

    if (!metadata.options || optionIndex >= metadata.options.length) {
      return NextResponse.json(
        { error: "Invalid option index" },
        { status: 400 }
      );
    }

    const option = metadata.options[optionIndex];

    // Toggle vote
    const voteIdx = option.votes.indexOf(session.user.id);
    if (voteIdx >= 0) {
      option.votes.splice(voteIdx, 1);
    } else {
      option.votes.push(session.user.id);
    }

    metadata.options[optionIndex] = option;

    // Update message metadata
    await prisma.message.update({
      where: { id: messageId },
      data: { metadata: JSON.stringify(metadata) },
    });

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("[PollVote] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
