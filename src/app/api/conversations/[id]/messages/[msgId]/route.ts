import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const editMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; msgId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, msgId } = await params;

  const body = await req.json();
  const result = editMessageSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  try {
    // Verify the message exists, belongs to this conversation, and user is the sender
    const message = await prisma.message.findFirst({
      where: {
        id: msgId,
        conversationId: id,
        senderId: session.user.id,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found or you are not the sender" },
        { status: 404 }
      );
    }

    if (message.isDeleted) {
      return NextResponse.json(
        { error: "Cannot edit a deleted message" },
        { status: 400 }
      );
    }

    const updated = await prisma.message.update({
      where: { id: msgId },
      data: {
        content: result.data.content,
        isEdited: true,
      },
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
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Message] PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; msgId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, msgId } = await params;

  try {
    // Verify the message exists, belongs to this conversation, and user is the sender
    const message = await prisma.message.findFirst({
      where: {
        id: msgId,
        conversationId: id,
        senderId: session.user.id,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found or you are not the sender" },
        { status: 404 }
      );
    }

    await prisma.message.update({
      where: { id: msgId },
      data: {
        isDeleted: true,
        content: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Message] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
