import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RECOMMENDED_SELECT = {
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
  _count: { select: { saves: true, applications: true } },
} as const;

function scoreEvent(
  event: {
    minGrade: number | null;
    maxGrade: number | null;
    isOnline: boolean;
    fee: number | null;
    registrationDeadline: Date | null;
    isFeatured: boolean;
  },
  userGradeNum: number | null,
  now: Date
): number {
  let score = 50;

  // Grade range match
  if (userGradeNum !== null) {
    const min = event.minGrade ?? 1;
    const max = event.maxGrade ?? 14;
    if (userGradeNum >= min && userGradeNum <= max) {
      score += 30;
    }
  }

  // Online accessibility
  if (event.isOnline) {
    score += 10;
  }

  // Free event
  if (event.fee === null) {
    score += 5;
  }

  // Deadline within 30 days
  if (event.registrationDeadline) {
    const daysUntilDeadline =
      (new Date(event.registrationDeadline).getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysUntilDeadline >= 0 && daysUntilDeadline <= 30) {
      score += 10;
    }
  }

  // Featured event
  if (event.isFeatured) {
    score += 5;
  }

  return score;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user profile for personalization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { grade: true, school: true, interests: true, skills: true },
    });

    // Parse grade to numeric (e.g. "10" -> 10, "UG" -> 13, "PG" -> 14)
    let userGradeNum: number | null = null;
    if (user?.grade) {
      const parsed = parseInt(user.grade, 10);
      if (!isNaN(parsed)) {
        userGradeNum = parsed;
      } else if (user.grade.toLowerCase().includes("ug")) {
        userGradeNum = 13;
      } else if (user.grade.toLowerCase().includes("pg")) {
        userGradeNum = 14;
      }
    }

    const now = new Date();

    // Fetch approved events with upcoming or no deadlines
    const events = await prisma.marketplaceEvent.findMany({
      where: {
        status: "APPROVED",
        OR: [
          { registrationDeadline: { gte: now } },
          { registrationDeadline: null },
        ],
      },
      select: RECOMMENDED_SELECT,
      take: 100, // Fetch a pool to score from
    });

    // Check which events the current user has saved
    const savedRecords = await prisma.marketplaceSave.findMany({
      where: { userId: session.user.id },
      select: { eventId: true },
    });
    const savedSet = new Set(savedRecords.map((s) => s.eventId));

    // Score and sort
    const scored = events
      .map((event) => ({
        ...event,
        isSaved: savedSet.has(event.id),
        score: scoreEvent(event, userGradeNum, now),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    return NextResponse.json(scored);
  } catch (error) {
    console.error("[Marketplace/recommended] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
