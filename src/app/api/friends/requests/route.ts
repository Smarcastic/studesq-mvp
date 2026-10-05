import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userSelect = {
  id: true,
  name: true,
  username: true,
  image: true,
  school: true,
  grade: true,
} as const;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "incoming";
    const userId = session.user.id;

    if (type !== "incoming" && type !== "outgoing") {
      return NextResponse.json(
        { error: "Invalid type parameter. Must be 'incoming' or 'outgoing'" },
        { status: 400 }
      );
    }

    if (type === "incoming") {
      const requests = await prisma.friendship.findMany({
        where: { addresseeId: userId, status: "pending" },
        include: { requester: { select: userSelect } },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(requests);
    }

    // outgoing
    const requests = await prisma.friendship.findMany({
      where: { requesterId: userId, status: "pending" },
      include: { addressee: { select: userSelect } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Friend requests GET error:", error);
    return NextResponse.json(
      { error: "Failed to load friend requests" },
      { status: 500 }
    );
  }
}
