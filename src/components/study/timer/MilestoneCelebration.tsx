"use client";

import { motion, AnimatePresence } from "framer-motion";
import { type Theme } from "./themes";

interface MilestoneCelebrationProps {
  milestone: number | null; // minutes, e.g. 5, 10, 15...
  theme: Theme;
  focusScore: number;
}

const MILESTONE_EMOJIS: Record<number, string> = {
  5: "⚡",
  10: "🔥",
  15: "💪",
  20: "🌟",
  25: "✨",
  30: "🏆",
  35: "💎",
  40: "🚀",
  45: "🌊",
  50: "👑",
  55: "⭐",
  60: "🎯",
};

const SPECIAL_MILESTONES = [25, 50, 60]; // gold treatment

export function MilestoneCelebration({
  milestone,
  theme,
  focusScore,
}: MilestoneCelebrationProps) {
  const isSpecial = milestone !== null && SPECIAL_MILESTONES.includes(milestone);
  const emoji = milestone !== null ? (MILESTONE_EMOJIS[milestone] || "⚡") : "";
  const isMinimal = theme.id === "minimal";

  return (
    <AnimatePresence>
      {milestone !== null && (
        <motion.div
          key={milestone}
          initial={{ opacity: 0, y: -30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 px-5 py-2.5 rounded-full"
          style={{
            background: isSpecial
              ? isMinimal
                ? "rgba(250, 204, 21, 0.12)"
                : "rgba(250, 204, 21, 0.15)"
              : isMinimal
                ? theme.surface
                : "rgba(255,255,255,0.1)",
            border: `1px solid ${
              isSpecial
                ? "rgba(250, 204, 21, 0.3)"
                : theme.surfaceBorder
            }`,
            backdropFilter: "blur(16px)",
            boxShadow: isSpecial
              ? "0 0 30px rgba(250, 204, 21, 0.15), 0 4px 20px rgba(0,0,0,0.2)"
              : "0 4px 20px rgba(0,0,0,0.15)",
          }}
        >
          <span className="text-lg">{emoji}</span>
          <div className="flex flex-col">
            <span
              className="text-sm font-bold tracking-wide"
              style={{
                color: isSpecial ? "#facc15" : theme.textColor,
              }}
            >
              {milestone} min
            </span>
            {/* Perfect focus subtitle for high scores */}
            {focusScore >= 80 && (
              <span
                className="text-[9px] font-medium tracking-wider uppercase"
                style={{
                  color: isSpecial ? "rgba(250, 204, 21, 0.7)" : theme.mutedText,
                }}
              >
                Perfect Focus
              </span>
            )}
          </div>

          {/* Gold shimmer for special milestones */}
          {isSpecial && (
            <motion.div
              className="absolute inset-0 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(250,204,21,0.2) 50%, transparent 60%)",
                  animation: "milestone-shimmer 1.5s ease-in-out infinite",
                }}
              />
            </motion.div>
          )}
        </motion.div>
      )}
      <style jsx global>{`
        @keyframes milestone-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </AnimatePresence>
  );
}
