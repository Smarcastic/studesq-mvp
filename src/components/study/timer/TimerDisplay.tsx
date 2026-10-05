"use client";

import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type Theme } from "./themes";

interface TimerDisplayProps {
  timeInSeconds: number;
  isCountUp: boolean;
  mode: string;
  sessionNumber: number;
  totalSessions: number;
  isBreak: boolean;
  isRunning: boolean;
  isPaused?: boolean;
  theme: Theme;
  focusScore?: number;
  secondsLeft?: number; // for final-minutes scale-up
  breathValue?: number; // 0–1 breathing cycle
}

export const TimerDisplay = memo(function TimerDisplay({
  timeInSeconds,
  isCountUp,
  mode,
  sessionNumber,
  totalSessions,
  isBreak,
  isRunning,
  isPaused = false,
  theme,
  focusScore,
  secondsLeft = 999,
  breathValue = 0,
}: TimerDisplayProps) {
  const minutes = Math.floor(Math.abs(timeInSeconds) / 60);
  const seconds = Math.abs(timeInSeconds) % 60;

  const mm1 = String(Math.floor(minutes / 10));
  const mm2 = String(minutes % 10);
  const ss1 = String(Math.floor(seconds / 10));
  const ss2 = String(seconds % 10);

  const modeLabel = isBreak
    ? "Take a break"
    : mode === "pomodoro"
      ? `Session ${sessionNumber} of ${totalSessions}`
      : mode === "deep_focus"
        ? "Deep Focus"
        : "Stopwatch";

  // Scale up in final 5 minutes (300s) — subtle
  const isNearEnd = secondsLeft <= 300 && secondsLeft > 0 && isRunning && !isBreak;
  const scaleBoost = isNearEnd ? 1 + (1 - secondsLeft / 300) * 0.06 : 1;

  // Breathing modulation for digits (very subtle)
  const breathScale = 1 + breathValue * 0.008;

  // Focus tier color for indicator
  const tierColor = useMemo(() => {
    if (focusScore === undefined) return "";
    if (focusScore >= 90) return "#4ade80";
    if (focusScore >= 70) return "#22d3ee";
    if (focusScore >= 50) return "#fbbf24";
    if (focusScore >= 30) return "#fb923c";
    return "#f87171";
  }, [focusScore]);

  const tierLabel = useMemo(() => {
    if (focusScore === undefined) return "";
    if (focusScore >= 90) return "Elite";
    if (focusScore >= 70) return "Strong";
    if (focusScore >= 50) return "Steady";
    if (focusScore >= 30) return "Warming Up";
    return "Distracted";
  }, [focusScore]);

  const isMinimal = theme.id === "minimal";

  // Pause desaturation filter
  const pauseFilter = isPaused ? "saturate(0.7) brightness(0.85)" : "none";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: scaleBoost * breathScale,
      }}
      transition={{
        delay: 0.2,
        duration: 0.4,
        scale: { duration: 0.8, ease: "easeOut" },
      }}
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{
        filter: pauseFilter,
        transition: "filter 0.5s ease",
      }}
    >
      {/* Digit display with flip animation + gradient text */}
      <div className="flex items-center gap-0.5 relative">
        <FlipDigit value={mm1} theme={theme} isRunning={isRunning} />
        <FlipDigit value={mm2} theme={theme} isRunning={isRunning} />

        {/* Pulsing colon */}
        <motion.span
          animate={
            isRunning
              ? {
                  opacity: [1, 0.2, 1],
                  scale: [1, 0.95, 1],
                }
              : { opacity: isPaused ? 0.5 : 1, scale: 1 }
          }
          transition={
            isRunning
              ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.5 }
          }
          className="text-[48px] md:text-[60px] font-extralight leading-none mx-0.5"
          style={{
            color: theme.textColor,
            textShadow: isRunning && !isMinimal
              ? `0 0 20px ${theme.glowColor}`
              : "none",
          }}
        >
          :
        </motion.span>

        <FlipDigit value={ss1} theme={theme} isRunning={isRunning} />
        <FlipDigit value={ss2} theme={theme} isRunning={isRunning} />
      </div>

      {/* Mode label */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-[13px] mt-3 font-medium tracking-wide"
        style={{ color: theme.mutedText }}
      >
        {modeLabel}
      </motion.span>

      {/* PAUSED badge */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mt-2 flex items-center gap-2"
          >
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="px-4 py-1 rounded-full"
              style={{
                background: isMinimal
                  ? "rgba(0,0,0,0.06)"
                  : "rgba(255,255,255,0.08)",
                border: `1px solid ${isMinimal ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.12)"}`,
                backdropFilter: "blur(8px)",
              }}
            >
              <span
                className="text-[10px] font-bold tracking-[0.25em] uppercase"
                style={{
                  color: theme.mutedText,
                  textShadow: isMinimal ? "none" : `0 0 10px ${theme.glowColor}`,
                }}
              >
                Paused
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced focus score indicator with tier label */}
      {focusScore !== undefined && focusScore > 0 && isRunning && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 mt-2.5"
        >
          {/* Pulsing dot */}
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: tierColor,
              boxShadow: `0 0 8px ${tierColor}`,
            }}
          />
          <span
            className="text-[10px] font-semibold tracking-widest uppercase"
            style={{ color: tierColor }}
          >
            {tierLabel}
          </span>
          <span
            className="text-[10px] font-medium tabular"
            style={{ color: theme.mutedText }}
          >
            {focusScore}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
});

/**
 * Single digit with vertical slide animation on value change.
 * Gradient text + micro-pulse when running.
 * GPU-accelerated via transform + opacity.
 */
const FlipDigit = memo(function FlipDigit({
  value,
  theme,
  isRunning,
}: {
  value: string;
  theme: Theme;
  isRunning: boolean;
}) {
  const isMinimal = theme.id === "minimal";

  return (
    <div className="relative overflow-hidden w-[32px] md:w-[40px] h-[56px] md:h-[72px] flex items-center justify-center">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -24, opacity: 0, filter: "blur(6px)" }}
          animate={{
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
          }}
          exit={{ y: 24, opacity: 0, filter: "blur(6px)" }}
          transition={{
            duration: 0.3,
            ease: [0.34, 1.56, 0.64, 1], // elastic overshoot
          }}
          className="absolute font-extralight tabular tracking-[-0.04em] text-[52px] md:text-[66px] leading-none"
          style={{
            color: theme.textColor,
            textShadow: isRunning && !isMinimal
              ? `0 0 30px ${theme.glowColor}, 0 0 60px ${theme.auraColor}`
              : "none",
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
});
