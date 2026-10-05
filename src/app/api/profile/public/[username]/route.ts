import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays } from "date-fns";

function safeJsonParse(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      bio: true,
      school: true,
      grade: true,
      location: true,
      graduationYear: true,
      interests: true,
      skills: true,
      xp: true,
      level: true,
      profilePublic: true,
      profileViews: true,
      trustScore: true,
      verifiedAchievementsCount: true,
      achievements: {
        where: {
          isPublic: true, // Only show public achievements
        },
        select: {
          id: true,
          title: true,
          category: true,
          date: true,
          verificationStatus: true,
          verificationLevel: true,
          externalLink: true,
          isHighlight: true,
        },
        orderBy: [
          { verificationLevel: "desc" }, // Verified first
          { date: "desc" },
        ],
      },
    },
  });

  if (!user || !user.profilePublic) {
    return NextResponse.json(
      { error: "Profile not found or private" },
      { status: 404 }
    );
  }

  // Increment view count
  await prisma.user.update({
    where: { id: user.id },
    data: { profileViews: { increment: 1 } },
  });

  // Calculate stats
  const now = new Date();
  const sixtyDaysAgo = subDays(now, 60);

  const [allSessions, grades, goalsCompleted] = await Promise.all([
    prisma.studySession.findMany({
      where: { userId: user.id, completedAt: { gte: sixtyDaysAgo } },
      select: { duration: true, completedAt: true },
      take: 1000,
    }),
    prisma.grade.findMany({
      where: { userId: user.id },
      select: { grade: true, credits: true },
    }),
    prisma.goal.count({
      where: { userId: user.id, status: "completed" },
    }),
  ]);

  // Total hours
  const totalStudyHours = Math.round(
    allSessions.reduce((a, s) => a + s.duration, 0) / 3600
  );

  // Streak
  let streak = 0;
  const sessionDates = new Set<string>();
  for (const s of allSessions) {
    sessionDates.add(startOfDay(new Date(s.completedAt)).toISOString());
  }
  let checkDate = startOfDay(now);
  if (!sessionDates.has(checkDate.toISOString())) {
    checkDate = subDays(checkDate, 1);
  }
  while (sessionDates.has(checkDate.toISOString())) {
    streak++;
    checkDate = subDays(checkDate, 1);
  }

  // GPA
  const GRADE_MAP: Record<string, number> = {
    "A+": 4.0, A: 4.0, "A-": 3.7,
    "B+": 3.3, B: 3.0, "B-": 2.7,
    "C+": 2.3, C: 2.0, "C-": 1.7,
    "D+": 1.3, D: 1.0, "D-": 0.7,
    F: 0.0,
  };
  let gpa: number | null = null;
  if (grades.length > 0) {
    let pts = 0, creds = 0;
    for (const g of grades) {
      const p = GRADE_MAP[g.grade.trim().toUpperCase()];
      if (p !== undefined) {
        pts += p * g.credits;
        creds += g.credits;
      }
    }
    if (creds > 0) gpa = Math.round((pts / creds) * 100) / 100;
  }

  return NextResponse.json({
    name: user.name,
    bio: user.bio,
    school: user.school,
    grade: user.grade,
    location: user.location,
    graduationYear: user.graduationYear,
    interests: safeJsonParse(user.interests),
    skills: safeJsonParse(user.skills),
    xp: user.xp,
    level: user.level,
    profileViews: user.profileViews,
    trustScore: user.trustScore,
    verifiedAchievementsCount: user.verifiedAchievementsCount,
    achievements: user.achievements,
    stats: {
      totalStudyHours,
      streak,
      gpa,
      achievementCount: user.achievements.length,
      goalsCompleted,
    },
  });
}
