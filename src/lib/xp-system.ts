/**
 * StudesQ XP & Prestige System
 *
 * Professional growth tracking — NOT childish gamification.
 * Levels reflect dedication, not cartoon badges.
 */

// =====================================================================
// LEVEL DEFINITIONS
// =====================================================================

export interface LevelInfo {
  name: string;
  minXP: number;
  maxXP: number;
  color: string; // Tailwind color
  bgColor: string;
  borderColor: string;
  icon: string; // emoji
  description: string;
}

export const LEVELS: LevelInfo[] = [
  {
    name: "Explorer",
    minXP: 0,
    maxXP: 499,
    color: "text-slate-500",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    icon: "🧭",
    description: "Starting your academic journey",
  },
  {
    name: "Achiever",
    minXP: 500,
    maxXP: 1999,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    icon: "⚡",
    description: "Building momentum and consistency",
  },
  {
    name: "Elite",
    minXP: 2000,
    maxXP: 4999,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    icon: "💎",
    description: "Demonstrating academic excellence",
  },
  {
    name: "Scholar",
    minXP: 5000,
    maxXP: 9999,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: "🏛️",
    description: "Distinguished academic record",
  },
  {
    name: "Titan",
    minXP: 10000,
    maxXP: Infinity,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    icon: "👑",
    description: "Exceptional dedication and mastery",
  },
];

// =====================================================================
// XP REWARDS
// =====================================================================

export const XP_REWARDS: Record<string, { xp: number; label: string }> = {
  study_session: { xp: 10, label: "Study Session Completed" },
  deep_focus_session: { xp: 25, label: "Deep Focus Session" },
  achievement_added: { xp: 50, label: "Achievement Logged" },
  streak_day: { xp: 15, label: "Streak Day Maintained" },
  goal_completed: { xp: 100, label: "Goal Completed" },
  habit_completed: { xp: 5, label: "Habit Completed" },
  flashcard_review: { xp: 8, label: "Flashcard Deck Reviewed" },
  reading_finished: { xp: 30, label: "Book Finished" },
  first_session: { xp: 20, label: "First Study Session" },
  week_streak: { xp: 50, label: "7-Day Streak" },
  month_streak: { xp: 200, label: "30-Day Streak" },
};

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Get level info for a given XP amount
 */
export function getLevelForXP(xp: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

/**
 * Get progress within current level (0-100)
 */
export function getLevelProgress(xp: number): number {
  const level = getLevelForXP(xp);
  if (level.maxXP === Infinity) return 100;
  const levelRange = level.maxXP - level.minXP;
  const progress = xp - level.minXP;
  return Math.min(100, Math.round((progress / levelRange) * 100));
}

/**
 * Get the next level, or null if at max
 */
export function getNextLevel(xp: number): LevelInfo | null {
  const current = getLevelForXP(xp);
  const idx = LEVELS.indexOf(current);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

/**
 * XP needed to reach next level
 */
export function xpToNextLevel(xp: number): number {
  const next = getNextLevel(xp);
  if (!next) return 0;
  return next.minXP - xp;
}

/**
 * Format XP with K suffix for large numbers
 */
export function formatXP(xp: number): string {
  if (xp >= 10000) return `${(xp / 1000).toFixed(1)}K`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toString();
}
