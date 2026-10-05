"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type Theme } from "./themes";

interface CompletionSequenceProps {
  show: boolean;
  theme: Theme;
  focusScore: number;
  duration: number; // elapsed seconds
  xpEarned?: number; // XP to animate counting up
  streak?: number;
  onDone: () => void; // called after sequence finishes
}

/**
 * Cinematic completion overlay — multi-phase:
 * Phase 1 (0–0.5s): Screen flash
 * Phase 2 (0.3–1.5s): Triple concentric shockwave rings
 * Phase 3 (0.5–2s): Rising ember particles
 * Phase 4 (1–3s): Focus score ring fill with spring overshoot
 * Phase 5 (2–3.5s): XP badge "slam" entrance
 * Phase 6 (3.5–4.5s): Gentle zoom-out exit
 */
export function CompletionSequence({
  show,
  theme,
  focusScore,
  duration,
  xpEarned = 0,
  streak = 0,
  onDone,
}: CompletionSequenceProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedXP, setAnimatedXP] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);

  const tierColor =
    focusScore >= 90
      ? "#4ade80"
      : focusScore >= 70
        ? "#22d3ee"
        : focusScore >= 50
          ? "#fbbf24"
          : focusScore >= 30
            ? "#fb923c"
            : "#f87171";

  const tierLabel =
    focusScore >= 90
      ? "Elite Focus"
      : focusScore >= 70
        ? "Strong Focus"
        : focusScore >= 50
          ? "Steady Focus"
          : focusScore >= 30
            ? "Warming Up"
            : "Keep Trying";

  const minutes = Math.round(duration / 60);

  // Generate ember particles
  const embers = useMemo(() => {
    const count = Math.floor(20 + (focusScore / 100) * 30); // 20-50 embers
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: -30 + Math.random() * 60, // spread from center
      delay: 0.5 + Math.random() * 1, // staggered 0.5–1.5s
      duration: 1.5 + Math.random() * 1.5, // 1.5–3s
      size: 2 + Math.random() * 4,
      drift: (Math.random() - 0.5) * 80, // horizontal sway
      opacity: 0.3 + Math.random() * 0.7,
    }));
  }, [focusScore]);

  // Animate score count-up with spring overshoot
  useEffect(() => {
    if (!show) {
      setAnimatedScore(0);
      setAnimatedXP(0);
      return;
    }

    startRef.current = performance.now();
    const scoreDelay = 1000; // slightly later for more dramatic build
    const scoreDuration = 1200;
    const xpDelay = 2000;
    const xpDuration = 800;
    const autoCloseDuration = 5000; // extended to 5s for more phases

    const animate = (now: number) => {
      const elapsed = now - startRef.current;

      // Score animation with overshoot
      if (elapsed > scoreDelay) {
        const scoreProgress = Math.min(1, (elapsed - scoreDelay) / scoreDuration);
        // Spring overshoot: goes to 105% then settles
        let eased: number;
        if (scoreProgress < 0.8) {
          eased = (scoreProgress / 0.8) * 1.05; // overshoot to 105%
        } else {
          const settle = (scoreProgress - 0.8) / 0.2;
          eased = 1.05 - 0.05 * settle; // settle back to 100%
        }
        eased = 1 - Math.pow(1 - Math.min(eased, 1.05), 3);
        setAnimatedScore(Math.min(focusScore, Math.round(focusScore * eased)));
      }

      // XP animation
      if (elapsed > xpDelay && xpEarned > 0) {
        const xpProgress = Math.min(1, (elapsed - xpDelay) / xpDuration);
        const eased = 1 - Math.pow(1 - xpProgress, 3);
        setAnimatedXP(Math.round(xpEarned * eased));
      }

      // Auto close
      if (elapsed >= autoCloseDuration) {
        onDone();
        return;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [show, focusScore, xpEarned, onDone]);

  const isMinimal = theme.id === "minimal";
  const ringR = 52;
  const circumference = 2 * Math.PI * ringR;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[70] flex items-center justify-center"
          onClick={onDone}
        >
          {/* Background dim */}
          <div
            className="absolute inset-0"
            style={{
              background: isMinimal
                ? "rgba(255,255,255,0.85)"
                : "rgba(0,0,0,0.75)",
              backdropFilter: "blur(20px)",
            }}
          />

          {/* Phase 1: Screen flash — 0–0.5s */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0"
            style={{
              background: isMinimal
                ? "rgba(6,182,212,0.15)"
                : `radial-gradient(circle at center, ${theme.glowColor} 0%, transparent 70%)`,
            }}
          />

          {/* Phase 2: Triple concentric shockwave rings — 0.3–1.5s */}
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.div
              key={`ring-shock-${i}`}
              initial={{ scale: 0.3, opacity: 0.8 - i * 0.2 }}
              animate={{ scale: 2.5 - i * 0.4, opacity: 0 }}
              transition={{
                duration: 1.2,
                delay: 0.3 + delay,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute w-[200px] h-[200px] rounded-full"
              style={{
                border: `${2 - i * 0.5}px solid ${theme.ringColor}`,
                boxShadow: i === 0 ? `0 0 40px ${theme.glowColor}` : "none",
              }}
            />
          ))}

          {/* Phase 3: Rising ember particles — 0.5–2s */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {embers.map((e) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 0, x: e.x }}
                animate={{
                  opacity: [0, e.opacity, e.opacity * 0.5, 0],
                  y: -250 - Math.random() * 100,
                  x: e.x + e.drift,
                }}
                transition={{
                  duration: e.duration,
                  delay: e.delay,
                  ease: "easeOut",
                }}
                className="absolute rounded-full"
                style={{
                  left: "50%",
                  top: "55%",
                  width: e.size,
                  height: e.size,
                  background: theme.confettiColors[e.id % 4],
                  boxShadow: `0 0 ${e.size * 2}px ${theme.confettiColors[e.id % 4]}`,
                }}
              />
            ))}
          </div>

          {/* Phase 1b: Secondary glow surge */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{
              scale: [0.3, 2.5],
              opacity: [0.8, 0],
            }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute w-[300px] h-[300px] rounded-full"
            style={{
              background: `radial-gradient(circle, ${theme.glowColor} 0%, transparent 70%)`,
            }}
          />

          {/* Content card — enters with spring */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{
              delay: 0.6,
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
            className="relative z-10 flex flex-col items-center px-10 py-8"
          >
            {/* Focus Score Ring */}
            <div className="relative w-[120px] h-[120px] mb-5">
              <svg width={120} height={120} viewBox="0 0 120 120">
                {/* Track */}
                <circle
                  cx={60}
                  cy={60}
                  r={ringR}
                  fill="none"
                  stroke={isMinimal ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)"}
                  strokeWidth={5}
                />
                {/* Score fill — animated with gradient feel */}
                <motion.circle
                  cx={60}
                  cy={60}
                  r={ringR}
                  fill="none"
                  stroke={tierColor}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{
                    strokeDashoffset: circumference * (1 - focusScore / 100),
                  }}
                  transition={{
                    delay: 1,
                    duration: 1.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  transform="rotate(-90 60 60)"
                />
                {/* Glow duplicate — thicker blur layer */}
                <motion.circle
                  cx={60}
                  cy={60}
                  r={ringR}
                  fill="none"
                  stroke={tierColor}
                  strokeWidth={10}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{
                    strokeDashoffset: circumference * (1 - focusScore / 100),
                  }}
                  transition={{
                    delay: 1,
                    duration: 1.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  transform="rotate(-90 60 60)"
                  opacity={0.15}
                  style={{ filter: "blur(6px)" }}
                />
              </svg>
              {/* Score number */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-3xl font-bold tabular"
                  style={{ color: tierColor }}
                >
                  {animatedScore}
                </span>
              </div>
            </div>

            {/* Tier label */}
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="text-sm font-bold uppercase tracking-[0.2em] mb-1"
              style={{ color: tierColor }}
            >
              {tierLabel}
            </motion.p>

            {/* Duration */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 1.8 }}
              className="text-sm font-medium mb-5"
              style={{ color: theme.textColor }}
            >
              {minutes} minute{minutes !== 1 ? "s" : ""} of focus
            </motion.p>

            {/* XP earned — slam entrance */}
            {xpEarned > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.3, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  delay: 2,
                  type: "spring",
                  stiffness: 400,
                  damping: 15,
                }}
                className="relative flex items-center gap-2 px-5 py-2.5 rounded-full"
                style={{
                  background: isMinimal
                    ? "rgba(250, 204, 21, 0.1)"
                    : "rgba(250, 204, 21, 0.12)",
                  border: "1px solid rgba(250, 204, 21, 0.2)",
                }}
              >
                {/* Radial glow burst behind XP badge */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 2, opacity: [0, 0.4, 0] }}
                  transition={{ delay: 2.1, duration: 0.6 }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(250,204,21,0.3) 0%, transparent 70%)",
                  }}
                />
                <span className="text-yellow-400 text-lg relative z-10">⚡</span>
                <span className="text-yellow-300 font-bold text-base tabular relative z-10">
                  +{animatedXP} XP
                </span>
              </motion.div>
            )}

            {/* Streak badge */}
            {streak > 1 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 2.5 }}
                className="text-xs font-medium mt-3"
                style={{ color: theme.textColor }}
              >
                🔥 {streak} sessions today
              </motion.p>
            )}

            {/* Tap to continue */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0.3] }}
              transition={{ delay: 3, duration: 1 }}
              className="text-[10px] mt-6 uppercase tracking-widest"
              style={{ color: theme.mutedText }}
            >
              Tap to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
