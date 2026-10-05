import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  isSameDay,
} from "date-fns";

const GRADE_MAP: Record<string, number> = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  "D-": 0.7,
  F: 0.0,
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
  const userId = session.user.id;
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const ninetyOneDaysAgo = subDays(now, 91);
  const thirtyDaysAgo = subDays(now, 30);
  const tomorrowEnd = endOfDay(addDays(now, 1));
  const sevenDaysFromNow = addDays(now, 7);

  const [
    achievementCount,
    studySessions,
    activeAssignments,
    upcomingAssignments,
    recentAchievements,
    streakSessions,
    grades,
    activeGoalsCount,
    recentNotes,
    todaySessions,
    latestMood,
    // -- NEW: Today's Focus --
    todayAssignments,
    upcomingExams,
    dueFlashcardsCount,
    // -- NEW: Badge Stats --
    totalSessionsCount,
    totalFlashcardReviews,
    goalsCompletedCount,
    notesCreatedCount,
    // -- NEW: Weekly Wins --
    weekAssignmentsDone,
    weekXP,
    weekFlashcardReviews,
    // -- NEW: Insights Data --
    insightSessions,
    insightHabits,
    insightMoods,
  ] = await Promise.all([
    // ---- EXISTING QUERIES ----
    prisma.achievement.count({ where: { userId } }),
    prisma.studySession.findMany({
      where: {
        userId,
        completedAt: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.assignment.count({
      where: { userId, status: { not: "done" } },
    }),
    prisma.assignment.findMany({
      where: {
        userId,
        status: { not: "done" },
        dueDate: { not: null },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.achievement.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),

    // Streak + Heatmap — 91 days with duration
    prisma.studySession.findMany({
      where: {
        userId,
        completedAt: { gte: ninetyOneDaysAgo },
      },
      select: { completedAt: true, duration: true },
      orderBy: { completedAt: "desc" },
      take: 2000,
    }),

    // GPA — all grades
    prisma.grade.findMany({
      where: { userId },
      select: { grade: true, credits: true },
    }),

    // Active goals count
    prisma.goal.count({
      where: { userId, status: "active" },
    }),

    // Recent notes
    prisma.note.findMany({
      where: { userId, isArchived: false },
      select: { id: true, title: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),

    // Today's study sessions
    prisma.studySession.findMany({
      where: {
        userId,
        completedAt: { gte: todayStart, lte: todayEnd },
      },
      select: { duration: true },
    }),

    // Latest mood entry
    prisma.moodEntry.findFirst({
      where: { userId },
      select: { mood: true, date: true },
      orderBy: { date: "desc" },
    }),

    // ---- TODAY'S FOCUS ----
    // Assignments due today or tomorrow, not done
    prisma.assignment.findMany({
      where: {
        userId,
        status: { not: "done" },
        dueDate: { gte: todayStart, lte: tomorrowEnd },
      },
      select: { id: true, title: true, subject: true, dueDate: true, priority: true },
      orderBy: { dueDate: "asc" },
      take: 8,
    }),

    // Exams within 7 days
    prisma.exam.findMany({
      where: {
        userId,
        date: { gte: todayStart, lte: sevenDaysFromNow },
      },
      select: { id: true, subject: true, date: true, color: true },
      orderBy: { date: "asc" },
      take: 5,
    }),

    // Flashcards due for review
    prisma.flashcard.count({
      where: {
        deck: { userId },
        nextReview: { lte: now },
      },
    }),

    // ---- BADGE STATS ----
    // Total study sessions ever
    prisma.studySession.count({ where: { userId } }),

    // Total flashcard reviews (from XP events)
    prisma.xPEvent.count({
      where: { userId, action: "flashcard_review" },
    }),

    // Goals completed ever
    prisma.goal.count({
      where: { userId, status: "completed" },
    }),

    // Notes created
    prisma.note.count({ where: { userId } }),

    // ---- WEEKLY WINS ----
    // Assignments completed this week
    prisma.assignment.count({
      where: {
        userId,
        status: "done",
        updatedAt: { gte: weekStart, lte: weekEnd },
      },
    }),

    // XP earned this week
    prisma.xPEvent.aggregate({
      where: {
        userId,
        createdAt: { gte: weekStart, lte: weekEnd },
      },
      _sum: { xp: true },
    }),

    // Flashcard reviews this week
    prisma.xPEvent.count({
      where: {
        userId,
        action: "flashcard_review",
        createdAt: { gte: weekStart, lte: weekEnd },
      },
    }),

    // ---- INSIGHTS DATA ----
    // Last 30 days study sessions for weakness detection
    prisma.studySession.findMany({
      where: {
        userId,
        completedAt: { gte: thirtyDaysAgo },
      },
      select: { subject: true, duration: true, completedAt: true, focusScore: true, mood: true },
      orderBy: { completedAt: "desc" },
      take: 500,
    }),

    // Habits with recent logs for insights
    prisma.habit.findMany({
      where: { userId },
      select: {
        title: true,
        logs: {
          where: { date: { gte: subDays(now, 7) } },
          select: { date: true, done: true },
        },
      },
    }),

    // Recent mood entries for insights
    prisma.moodEntry.findMany({
      where: { userId },
      select: { mood: true, date: true },
      orderBy: { date: "desc" },
      take: 7,
    }),
  ]);

  // Calculate weekly study minutes
  const totalStudyMinutes = studySessions.reduce(
    (acc, s) => acc + Math.floor(s.duration / 60),
    0
  );

  // Calculate today's study minutes
  const todayStudyMinutes = todaySessions.reduce(
    (acc, s) => acc + Math.floor(s.duration / 60),
    0
  );

  // Calculate streak — walk backwards from today checking consecutive days
  let streak = 0;
  if (streakSessions.length > 0) {
    // Collect unique dates (as date-only strings for comparison)
    const sessionDates = new Set<string>();
    for (const s of streakSessions) {
      const d = startOfDay(new Date(s.completedAt));
      sessionDates.add(d.toISOString());
    }

    // Walk backwards day by day starting from today
    let checkDate = startOfDay(now);
    // If no session today, start from yesterday
    if (!sessionDates.has(checkDate.toISOString())) {
      checkDate = subDays(checkDate, 1);
      // If also no session yesterday, streak is 0
      if (!sessionDates.has(checkDate.toISOString())) {
        streak = 0;
      } else {
        streak = 1;
        checkDate = subDays(checkDate, 1);
        while (sessionDates.has(checkDate.toISOString())) {
          streak++;
          checkDate = subDays(checkDate, 1);
        }
      }
    } else {
      streak = 1;
      checkDate = subDays(checkDate, 1);
      while (sessionDates.has(checkDate.toISOString())) {
        streak++;
        checkDate = subDays(checkDate, 1);
      }
    }
  }

  // Calculate unweighted GPA weighted by credits
  let gpa: number | null = null;
  if (grades.length > 0) {
    let totalPoints = 0;
    let totalCredits = 0;
    for (const g of grades) {
      const letterGrade = g.grade.trim().toUpperCase();
      const points = GRADE_MAP[letterGrade];
      if (points !== undefined) {
        totalPoints += points * g.credits;
        totalCredits += g.credits;
      }
    }
    if (totalCredits > 0) {
      gpa = Math.round((totalPoints / totalCredits) * 100) / 100;
    }
  }

  return NextResponse.json({
    stats: {
      achievements: achievementCount,
      studyMinutes: totalStudyMinutes,
      activeAssignments,
      streak,
      gpa,
      activeGoals: activeGoalsCount,
      todayStudyMinutes,
    },
    upcomingAssignments,
    recentAchievements,
    recentNotes,
    latestMood,
    // -- NEW DATA --
    todayFocus: {
      assignments: todayAssignments,
      exams: upcomingExams,
      dueFlashcards: dueFlashcardsCount,
    },
    badgeStats: {
      streak,
      totalStudyMinutes: Math.round(
        streakSessions.reduce((a, s) => a + s.duration, 0) / 60
      ),
      totalSessions: totalSessionsCount,
      flashcardsReviewed: totalFlashcardReviews,
      goalsCompleted: goalsCompletedCount,
      achievementCount,
      notesCreated: notesCreatedCount,
      gpa,
    },
    weeklyWins: {
      studyMinutes: totalStudyMinutes,
      assignmentsDone: weekAssignmentsDone,
      flashcardReviews: weekFlashcardReviews,
      xpEarned: weekXP._sum.xp || 0,
      streak,
    },
    heatmapSessions: streakSessions,
    insightsData: {
      studySessions: insightSessions,
      habits: insightHabits,
      moodEntries: insightMoods,
    },
  });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
