import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const saves = await prisma.marketplaceSave.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          select: {
            id: true,
            slug: true,
            title: true,
            category: true,
            organizerName: true,
            organizerType: true,
            description: true,
            coverImageUrl: true,
            city: true,
            state: true,
            isOnline: true,
            isHybrid: true,
            eventStartDate: true,
            eventEndDate: true,
            registrationDeadline: true,
            fee: true,
            feeWaiversAvailable: true,
            minGrade: true,
            maxGrade: true,
            difficulty: true,
            teamSize: true,
            tags: true,
            prizePool: true,
            isVerified: true,
            isFeatured: true,
            isRecurring: true,
            viewCount: true,
            saveCount: true,
            status: true,
            _count: { select: { saves: true, applications: true } },
          },
        },
      },
    });

    // For each saved event, fetch the user's application status if any
    const eventIds = saves.map((s) => s.eventId);
    const applications = await prisma.marketplaceApplication.findMany({
      where: {
        userId: session.user.id,
        eventId: { in: eventIds },
      },
      select: { eventId: true, status: true },
    });
    const applicationMap = new Map(applications.map((a) => [a.eventId, a.status]));

    const result = saves.map((save) => ({
      ...save.event,
      savedAt: save.createdAt,
      applicationStatus: applicationMap.get(save.eventId) ?? null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Marketplace/saved] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
