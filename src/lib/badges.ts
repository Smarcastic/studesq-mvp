/**
 * StudesQ Badge & Milestone System
 *
 * Client-side badge computation — no schema changes needed.
 * Badges are earned based on aggregate stats from the dashboard API.
 */

export interface BadgeStats {
  streak: number;
  totalStudyMinutes: number;
  totalSessions: number;
  flashcardsReviewed: number;
  goalsCompleted: number;
  achievementCount: number;
  notesCreated: number;
  gpa: number | null;
}

export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "streak" | "study" | "flashcard" | "habit" | "academic" | "milestone";
  rarity: "common" | "rare" | "epic" | "legendary";
  check: (stats: BadgeStats) => boolean;
}

export const BADGES: BadgeDef[] = [
  // ---- MILESTONE (Getting started) ----
  {
    id: "first_steps",
    title: "First Steps",
    description: "Complete your first study session",
    icon: "👣",
    category: "milestone",
    rarity: "common",
    check: (s) => s.totalSessions >= 1,
  },
  {
    id: "note_taker",
    title: "Note Taker",
    description: "Create your first note",
    icon: "📝",
    category: "milestone",
    rarity: "common",
    check: (s) => s.notesCreated >= 1,
  },
  {
    id: "goal_setter",
    title: "Goal Setter",
    description: "Complete your first goal",
    icon: "🎯",
    category: "milestone",
    rarity: "common",
    check: (s) => s.goalsCompleted >= 1,
  },
  {
    id: "trophy_hunter",
    title: "Trophy Hunter",
    description: "Log your first achievement",
    icon: "🏆",
    category: "milestone",
    rarity: "common",
    check: (s) => s.achievementCount >= 1,
  },

  // ---- STREAK ----
  {
    id: "week_warrior",
    title: "Week Warrior",
    description: "Maintain a 7-day study streak",
    icon: "🔥",
    category: "streak",
    rarity: "rare",
    check: (s) => s.streak >= 7,
  },
  {
    id: "fortnight_focus",
    title: "Fortnight Focus",
    description: "Maintain a 14-day study streak",
    icon: "⚡",
    category: "streak",
    rarity: "rare",
    check: (s) => s.streak >= 14,
  },
  {
    id: "monthly_master",
    title: "Monthly Master",
    description: "Maintain a 30-day study streak",
    icon: "💪",
    category: "streak",
    rarity: "epic",
    check: (s) => s.streak >= 30,
  },
  {
    id: "unstoppable",
    title: "Unstoppable",
    description: "Maintain a 60-day study streak",
    icon: "🚀",
    category: "streak",
    rarity: "legendary",
    check: (s) => s.streak >= 60,
  },

  // ---- STUDY TIME ----
  {
    id: "ten_hours",
    title: "Getting Serious",
    description: "Study for 10 total hours",
    icon: "📖",
    category: "study",
    rarity: "common",
    check: (s) => s.totalStudyMinutes >= 600,
  },
  {
    id: "fifty_hours",
    title: "Dedicated Scholar",
    description: "Study for 50 total hours",
    icon: "📚",
    category: "study",
    rarity: "rare",
    check: (s) => s.totalStudyMinutes >= 3000,
  },
  {
    id: "century_club",
    title: "Century Club",
    description: "Study for 100 total hours",
    icon: "💯",
    category: "study",
    rarity: "epic",
    check: (s) => s.totalStudyMinutes >= 6000,
  },
  {
    id: "marathon_mind",
    title: "Marathon Mind",
    description: "Study for 500 total hours",
    icon: "🧠",
    category: "study",
    rarity: "legendary",
    check: (s) => s.totalStudyMinutes >= 30000,
  },

  // ---- FLASHCARDS ----
  {
    id: "flash_starter",
    title: "Flash Starter",
    description: "Review 10 flashcard decks",
    icon: "🃏",
    category: "flashcard",
    rarity: "common",
    check: (s) => s.flashcardsReviewed >= 10,
  },
  {
    id: "flash_master",
    title: "Flash Master",
    description: "Review 100 flashcard decks",
    icon: "⚡",
    category: "flashcard",
    rarity: "rare",
    check: (s) => s.flashcardsReviewed >= 100,
  },
  {
    id: "flash_legend",
    title: "Flash Legend",
    description: "Review 500 flashcard decks",
    icon: "🌟",
    category: "flashcard",
    rarity: "epic",
    check: (s) => s.flashcardsReviewed >= 500,
  },

  // ---- ACADEMIC ----
  {
    id: "honor_roll",
    title: "Honor Roll",
    description: "Achieve a GPA of 3.5 or higher",
    icon: "🎓",
    category: "academic",
    rarity: "rare",
    check: (s) => s.gpa !== null && s.gpa >= 3.5,
  },
  {
    id: "straight_a",
    title: "Straight A's",
    description: "Achieve a perfect 4.0 GPA",
    icon: "💎",
    category: "academic",
    rarity: "legendary",
    check: (s) => s.gpa !== null && s.gpa >= 4.0,
  },
  {
    id: "five_goals",
    title: "Goal Crusher",
    description: "Complete 5 goals",
    icon: "🏅",
    category: "academic",
    rarity: "rare",
    check: (s) => s.goalsCompleted >= 5,
  },
  {
    id: "ten_achievements",
    title: "Overachiever",
    description: "Log 10 achievements",
    icon: "🌠",
    category: "academic",
    rarity: "epic",
    check: (s) => s.achievementCount >= 10,
  },

  // ---- SESSIONS ----
  {
    id: "fifty_sessions",
    title: "Regular",
    description: "Complete 50 study sessions",
    icon: "📅",
    category: "study",
    rarity: "rare",
    check: (s) => s.totalSessions >= 50,
  },
  {
    id: "two_hundred_sessions",
    title: "Consistent",
    description: "Complete 200 study sessions",
    icon: "🔄",
    category: "study",
    rarity: "epic",
    check: (s) => s.totalSessions >= 200,
  },
];

export const RARITY_COLORS: Record<BadgeDef["rarity"], { bg: string; text: string; border: string }> = {
  common: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
  rare: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  epic: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  legendary: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
};

/**
 * Check which badges the user has earned
 */
export function checkBadgeEligibility(stats: BadgeStats): string[] {
  return BADGES.filter((b) => b.check(stats)).map((b) => b.id);
}

/**
 * Get badge definition by ID
 */
export function getBadgeById(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}
