"use client";

import { motion } from "framer-motion";
import { type Theme } from "./themes";

interface MomentumBarProps {
  theme: Theme;
  focusScore: number; // 0–100
  elapsed: number; // seconds
  pauseCount: number;
  streak: number; // consecutive sessions
  isRunning: boolean;
}

/**
 * Compact momentum/focus bar shown below the ring.
 * Shows real-time focus quality + session streak.
 */
export function MomentumBar({
  theme,
  focusScore,
  elapsed,
  pauseCount,
  streak,
  isRunning,
}: MomentumBarProps) {
  const isMinimal = theme.id === "minimal";

  const tier = getFocusTier(focusScore);

  // Only show after 10s of elapsed time
  if (elapsed < 10 && !isRunning) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="flex items-center gap-4 mt-6 px-5 py-3 rounded-2xl"
      style={{
        background: isMinimal ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${theme.surfaceBorder}`,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Focus Score */}
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8">
          <svg width={32} height={32} viewBox="0 0 32 32">
            <circle
              cx={16}
              cy={16}
              r={13}
              fill="none"
              stroke={isMinimal ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)"}
              strokeWidth={3}
            />
            <motion.circle
              cx={16}
              cy={16}
              r={13}
              fill="none"
              stroke={tier.color}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 13}
              animate={{
                strokeDashoffset: 2 * Math.PI * 13 * (1 - focusScore / 100),
              }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              transform="rotate(-90 16 16)"
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
            style={{ color: tier.color }}
          >
            {focusScore}
          </span>
        </div>
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: tier.color }}
          >
            {tier.label}
          </p>
          <p
            className="text-[9px]"
            style={{ color: theme.mutedText }}
          >
            Focus Score
          </p>
        </div>
      </div>

      {/* Divider */}
      <div
        className="w-px h-6"
        style={{
          background: isMinimal ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
        }}
      />

      {/* Pauses */}
      <div className="text-center">
        <p
          className="text-sm font-semibold tabular"
          style={{ color: theme.textColor, opacity: 0.9 }}
        >
          {pauseCount}
        </p>
        <p className="text-[9px]" style={{ color: theme.mutedText }}>
          Pauses
        </p>
      </div>

      {/* Divider */}
      <div
        className="w-px h-6"
        style={{
          background: isMinimal ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
        }}
      />

      {/* Streak */}
      <div className="text-center">
        <p
          className="text-sm font-semibold tabular"
          style={{ color: theme.textColor, opacity: 0.9 }}
        >
          {streak}
        </p>
        <p className="text-[9px]" style={{ color: theme.mutedText }}>
          Streak
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================
// Focus Score Engine
// ============================================================

export interface FocusState {
  pauseCount: number;
  totalPauseDuration: number; // seconds spent paused
  elapsed: number; // seconds since session started
  targetDuration: number; // full session length in seconds
}

/**
 * Calculate focus score (0–100).
 *
 * - Full session without pauses = 100
 * - Each pause reduces score by 8
 * - Long pause durations further reduce
 * - Streak multiplier adds bonus
 */
export function calculateFocusScore(state: FocusState, streak: number): number {
  if (state.elapsed < 10) return 100; // too early

  const completionRatio =
    state.targetDuration > 0
      ? Math.min(1, state.elapsed / state.targetDuration)
      : 1;

  // Base: 100
  let score = 100;

  // Deduct for pauses (-8 each, max -40)
  score -= Math.min(40, state.pauseCount * 8);

  // Deduct for total pause time (max -30)
  const pauseRatio =
    state.elapsed > 0 ? state.totalPauseDuration / state.elapsed : 0;
  score -= Math.min(30, Math.round(pauseRatio * 100));

  // Bonus for completion (up to +10)
  score += Math.round(completionRatio * 10);

  // Streak bonus (+2 per streak day, max +10)
  score += Math.min(10, streak * 2);

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getFocusTier(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Elite", color: "#4ade80" };
  if (score >= 70) return { label: "Strong", color: "#22d3ee" };
  if (score >= 50) return { label: "Steady", color: "#fbbf24" };
  if (score >= 30) return { label: "Warming Up", color: "#fb923c" };
  return { label: "Distracted", color: "#f87171" };
}

/**
 * Encouragement messages shown after session completion.
 */
export function getEncouragement(
  score: number,
  minutes: number,
  streak: number
): string {
  if (score >= 95 && minutes >= 25)
    return `${minutes} minutes of perfect focus. Legendary.`;
  if (score >= 90)
    return `Elite focus for ${minutes} minutes. You're in the zone.`;
  if (score >= 80)
    return `Strong session. ${minutes} minutes well spent.`;
  if (score >= 60)
    return `${minutes} minutes done. Building momentum.`;
  if (streak >= 3)
    return `${streak} sessions today. Consistency is power.`;
  return `${minutes} minutes logged. Every session counts.`;
}
