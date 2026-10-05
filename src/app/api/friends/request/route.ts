import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const requestSchema = z.object({
  addresseeId: z.string().min(1, "addresseeId is required"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: z.treeifyError(result.error) },
        { status: 400 }
      );
    }

    const { addresseeId } = result.data;
    const userId = session.user.id;

    // Cannot friend yourself
    if (addresseeId === userId) {
      return NextResponse.json(
        { error: "You cannot send a friend request to yourself" },
        { status: 400 }
      );
    }

    // Verify addressee exists
    const addressee = await prisma.user.findUnique({
      where: { id: addresseeId },
      select: { id: true },
    });

    if (!addressee) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check for existing friendship in either direction
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId },
          { requesterId: addresseeId, addresseeId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === "accepted") {
        return NextResponse.json(
          { error: "You are already friends with this user" },
          { status: 409 }
        );
      }
      if (existing.status === "pending") {
        return NextResponse.json(
          { error: "A friend request already exists between you and this user" },
          { status: 409 }
        );
      }
      if (existing.status === "blocked") {
        return NextResponse.json(
          { error: "Unable to send friend request" },
          { status: 403 }
        );
      }
      // If rejected, allow re-sending by deleting old and creating new
      await prisma.friendship.delete({ where: { id: existing.id } });
    }

    const friendship = await prisma.friendship.create({
      data: {
        requesterId: userId,
        addresseeId,
        status: "pending",
      },
      include: {
        addressee: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    return NextResponse.json(friendship, { status: 201 });
  } catch (error) {
    console.error("Friend request POST error:", error);
    return NextResponse.json(
      { error: "Failed to send friend request" },
      { status: 500 }
    );
  }
}
