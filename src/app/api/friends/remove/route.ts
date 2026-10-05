import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const removeSchema = z.object({
  friendshipId: z.string().min(1, "friendshipId is required"),
});

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = removeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: z.treeifyError(result.error) },
        { status: 400 }
      );
    }

    const { friendshipId } = result.data;
    const userId = session.user.id;

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: "Friendship not found" },
        { status: 404 }
      );
    }

    // Only participants can remove a friendship
    if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
      return NextResponse.json(
        { error: "You are not authorized to remove this friendship" },
        { status: 403 }
      );
    }

    await prisma.friendship.delete({
      where: { id: friendshipId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Friend remove DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to remove friend" },
      { status: 500 }
    );
  }
}
