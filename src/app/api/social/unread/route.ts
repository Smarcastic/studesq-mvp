import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Count pending incoming friend requests
    const pendingRequests = await prisma.friendship.count({
      where: { addresseeId: userId, status: "pending" },
    });

    // Count conversations with unread messages
    // A conversation is unread if lastMessageAt > member.lastReadAt (or lastReadAt is null)
    const members = await prisma.conversationMember.findMany({
      where: { userId },
      include: {
        conversation: {
          select: { lastMessageAt: true },
        },
      },
    });

    let unreadChats = 0;
    for (const member of members) {
      const lastMsg = member.conversation.lastMessageAt;
      if (!lastMsg) continue;

      if (!member.lastReadAt || lastMsg > member.lastReadAt) {
        unreadChats++;
      }
    }

    return NextResponse.json({ pendingRequests, unreadChats });
  } catch (error) {
    console.error("Social unread GET error:", error);
    return NextResponse.json(
      { error: "Failed to load unread counts" },
      { status: 500 }
    );
  }
}
