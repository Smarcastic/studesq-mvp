import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const friendSelect = {
  id: true,
  name: true,
  username: true,
  image: true,
  school: true,
  grade: true,
  lastSeenAt: true,
} as const;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Friendships where current user is the requester
    const requested = await prisma.friendship.findMany({
      where: { requesterId: userId, status: "accepted" },
      include: { addressee: { select: friendSelect } },
    });

    // Friendships where current user is the addressee
    const received = await prisma.friendship.findMany({
      where: { addresseeId: userId, status: "accepted" },
      include: { requester: { select: friendSelect } },
    });

    // Flatten to a single array of friend objects
    const friends = [
      ...requested.map((f) => ({
        friendshipId: f.id,
        ...f.addressee,
      })),
      ...received.map((f) => ({
        friendshipId: f.id,
        ...f.requester,
      })),
    ];

    return NextResponse.json(friends);
  } catch (error) {
    console.error("Friends GET error:", error);
    return NextResponse.json(
      { error: "Failed to load friends" },
      { status: 500 }
    );
  }
}
