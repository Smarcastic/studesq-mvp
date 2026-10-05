export type BurnoutLevel = "low" | "moderate" | "high";

export interface BurnoutRisk {
  level: BurnoutLevel;
  score: number; // 0-100
  factors: string[];
  suggestion: string;
}

export function calculateBurnoutRisk(data: {
  studyMinutesThisWeek: number;
  moodTrend: number[]; // last 7 days mood levels (1-5)
  overdueAssignments: number;
  consecutiveStudyDays: number;
}): BurnoutRisk {
  let score = 0;
  const factors: string[] = [];

  // Study hours > 30/week
  if (data.studyMinutesThisWeek > 30 * 60) {
    score += 30;
    factors.push(
      `You've studied ${Math.round(data.studyMinutesThisWeek / 60)} hours this week`
    );
  } else if (data.studyMinutesThisWeek > 20 * 60) {
    score += 15;
  }

  // Mood declining
  if (data.moodTrend.length >= 5) {
    const recent = data.moodTrend.slice(-5);
    const isDecline =
      recent.length >= 2 && recent[recent.length - 1] < recent[0];
    if (isDecline) {
      score += 25;
      factors.push("Your mood has been declining over the past few days");
    }
  }

  // Overdue assignments
  if (data.overdueAssignments > 3) {
    score += 25;
    factors.push(`${data.overdueAssignments} overdue assignments`);
  } else if (data.overdueAssignments > 1) {
    score += 10;
  }

  // No breaks
  if (data.consecutiveStudyDays > 5) {
    score += 20;
    factors.push(
      `${data.consecutiveStudyDays} consecutive days without a break`
    );
  }

  const level: BurnoutLevel =
    score >= 50 ? "high" : score >= 25 ? "moderate" : "low";

  const suggestion =
    level === "high"
      ? "Consider taking a lighter day tomorrow"
      : level === "moderate"
        ? "Try to take some breaks between study sessions"
        : "You're managing your workload well";

  return {
    level,
    score: Math.min(score, 100),
    factors,
    suggestion,
  };
}
