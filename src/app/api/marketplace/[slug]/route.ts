import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const event = await prisma.marketplaceEvent.findUnique({
      where: { slug },
      include: {
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { saves: true, applications: true },
        },
      },
    });

    if (!event || event.status !== "APPROVED") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Increment viewCount (fire-and-forget style, don't await)
    prisma.marketplaceEvent
      .update({
        where: { slug },
        data: { viewCount: { increment: 1 } },
      })
      .catch((err) => console.error("[Marketplace] viewCount increment error:", err));

    // Check if current user has saved this event
    const savedRecord = await prisma.marketplaceSave.findUnique({
      where: {
        userId_eventId: { userId: session.user.id, eventId: event.id },
      },
    });

    // Get current user's application if any
    const userApplication = await prisma.marketplaceApplication.findUnique({
      where: {
        userId_eventId: { userId: session.user.id, eventId: event.id },
      },
    });

    return NextResponse.json({
      ...event,
      isSaved: !!savedRecord,
      userApplication: userApplication ?? null,
    });
  } catch (error) {
    console.error("[Marketplace/slug] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
