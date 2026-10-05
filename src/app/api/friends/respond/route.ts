import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const respondSchema = z.object({
  friendshipId: z.string().min(1, "friendshipId is required"),
  action: z.enum(["accept", "reject"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = respondSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: z.treeifyError(result.error) },
        { status: 400 }
      );
    }

    const { friendshipId, action } = result.data;
    const userId = session.user.id;

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: "Friend request not found" },
        { status: 404 }
      );
    }

    // Only the addressee can respond to the request
    if (friendship.addresseeId !== userId) {
      return NextResponse.json(
        { error: "You are not authorized to respond to this request" },
        { status: 403 }
      );
    }

    if (friendship.status !== "pending") {
      return NextResponse.json(
        { error: "This request has already been responded to" },
        { status: 400 }
      );
    }

    const updated = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: action === "accept" ? "accepted" : "rejected" },
      include: {
        requester: {
          select: { id: true, name: true, username: true, image: true },
        },
        addressee: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Friend respond POST error:", error);
    return NextResponse.json(
      { error: "Failed to respond to friend request" },
      { status: 500 }
    );
  }
}
