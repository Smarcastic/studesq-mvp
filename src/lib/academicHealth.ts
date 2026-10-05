export type HealthStatus = "excellent" | "good" | "needs-attention" | "critical";

export interface AcademicHealthScore {
  total: number; // 0-100
  breakdown: {
    study: number; // 0-30
    gpa: number; // 0-25
    assignments: number; // 0-20
    goals: number; // 0-15
    flashcards: number; // 0-10
  };
  weeklyDelta: number;
  status: HealthStatus;
  statusMessage: string;
}

export function calculateAcademicHealth(data: {
  recentSessions: { date: Date; durationMinutes: number }[];
  grades: { gradePoints: number; semester: string }[];
  assignments: { status: string; dueDate: Date; createdAt: Date }[];
  goals: { progress: number; isComplete: boolean }[];
  flashcards: { nextReview: Date }[];
}): AcademicHealthScore {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Study consistency (0-30): did they study most days this week?
  const studyDays = new Set(
    data.recentSessions
      .filter((s) => s.date >= sevenDaysAgo)
      .map((s) => s.date.toDateString())
  ).size;
  const studyScore = Math.round((studyDays / 7) * 30);

  // GPA score (0-25): is current GPA above 3.0?
  const avgGPA =
    data.grades.length > 0
      ? data.grades.reduce((sum, g) => sum + g.gradePoints, 0) /
        data.grades.length
      : 3.0;
  const gpaScore = Math.round(Math.min(avgGPA / 4.0, 1) * 25);

  // Assignment completion (0-20)
  const dueAssignments = data.assignments.filter(
    (a) => a.dueDate <= now
  );
  const completedOnTime = dueAssignments.filter(
    (a) => a.status === "done"
  ).length;
  const assignmentScore =
    dueAssignments.length > 0
      ? Math.round((completedOnTime / dueAssignments.length) * 20)
      : 20;

  // Goal progress (0-15)
  const avgGoalProgress =
    data.goals.length > 0
      ? data.goals.reduce((sum, g) => sum + g.progress, 0) / data.goals.length
      : 50;
  const goalScore = Math.round((avgGoalProgress / 100) * 15);

  // Flashcard review (0-10)
  const dueCards = data.flashcards.filter(
    (f) => f.nextReview <= now
  ).length;
  const flashcardScore =
    data.flashcards.length > 0
      ? Math.round(Math.max(0, 1 - dueCards / data.flashcards.length) * 10)
      : 10;

  const total =
    studyScore + gpaScore + assignmentScore + goalScore + flashcardScore;

  const status: HealthStatus =
    total >= 80
      ? "excellent"
      : total >= 60
        ? "good"
        : total >= 40
          ? "needs-attention"
          : "critical";

  const statusMessage =
    status === "excellent"
      ? "You're crushing it this week"
      : status === "good"
        ? "Solid week — keep the momentum"
        : status === "needs-attention"
          ? "A few areas need attention"
          : "Let's get back on track";

  return {
    total,
    breakdown: {
      study: studyScore,
      gpa: gpaScore,
      assignments: assignmentScore,
      goals: goalScore,
      flashcards: flashcardScore,
    },
    weeklyDelta: 0,
    status,
    statusMessage,
  };
}
