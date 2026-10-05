"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type Theme } from "./themes";
import { getEncouragement } from "./MomentumBar";

interface SessionLoggerProps {
  open: boolean;
  onSave: (data: {
    subject: string;
    focusRating: number;
    note: string;
    focusScore: number;
  }) => void;
  onSkip: () => void;
  duration: number; // seconds
  theme: Theme;
  focusScore: number; // 0-100
  streak: number; // today's session count
  defaultSubject?: string; // pre-fill from timer subject input
}

const FOCUS_RATINGS = [
  { value: 1, emoji: "\uD83D\uDE24", label: "Distracted" },
  { value: 2, emoji: "\uD83D\uDE10", label: "Okay" },
  { value: 3, emoji: "\uD83D\uDE42", label: "Good" },
  { value: 4, emoji: "\uD83D\uDE0A", label: "Great" },
  { value: 5, emoji: "\uD83D\uDD25", label: "In the zone" },
];

const DEFAULT_SUBJECTS = [
  "Math",
  "Science",
  "English",
  "History",
  "Computer Science",
  "Languages",
  "Art",
  "Music",
  "Other",
];

export function SessionLogger({
  open,
  onSave,
  onSkip,
  duration,
  theme,
  focusScore,
  streak,
  defaultSubject = "",
}: SessionLoggerProps) {
  const [subject, setSubject] = useState(defaultSubject);
  const [focusRating, setFocusRating] = useState(0);
  const [note, setNote] = useState("");
  const [recentSubjects, setRecentSubjects] = useState<string[]>([]);

  // Sync default subject when logger opens
  useEffect(() => {
    if (open && defaultSubject) setSubject(defaultSubject);
  }, [open, defaultSubject]);

  // Fetch recent subjects from past sessions
  useEffect(() => {
    if (!open) return;
    fetch("/api/study-sessions?limit=20")
      .then((r) => (r.ok ? r.json() : []))
      .then((sessions: { subject?: string }[]) => {
        const subjects = sessions
          .map((s) => s.subject)
          .filter((s): s is string => !!s && s.trim() !== "");
        // Deduplicate, preserving order of most recent
        const unique = [...new Set(subjects)];
        // Remove any that are already in DEFAULT_SUBJECTS
        const filtered = unique.filter(
          (s) => !DEFAULT_SUBJECTS.includes(s)
        );
        setRecentSubjects(filtered.slice(0, 5));
      })
      .catch(() => {});
  }, [open]);

  const isMinimal = theme.id === "minimal";
  const bg = isMinimal ? "rgba(255,255,255,0.98)" : "rgba(8,8,16,0.95)";
  const border = isMinimal ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";

  const minutes = Math.round(duration / 60);
  const encouragement = getEncouragement(focusScore, minutes, streak);

  const tierColor =
    focusScore >= 90
      ? "#4ade80"
      : focusScore >= 70
        ? "#22d3ee"
        : focusScore >= 50
          ? "#fbbf24"
          : "#f87171";
  const tierLabel =
    focusScore >= 90
      ? "Elite"
      : focusScore >= 70
        ? "Strong"
        : focusScore >= 50
          ? "Steady"
          : "Keep Going";

  const handleSave = () => {
    onSave({ subject, focusRating, note, focusScore });
    setSubject("");
    setFocusRating(0);
    setNote("");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[75]"
            onClick={onSkip}
          />
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="fixed bottom-0 left-0 right-0 z-[80] rounded-t-[28px] max-h-[85vh] overflow-y-auto"
            style={{
              background: bg,
              backdropFilter: "blur(32px)",
              borderTop: `1px solid ${border}`,
              boxShadow: "0 -8px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div className="max-w-md mx-auto p-6 pb-8">
              {/* Handle bar */}
              <div className="flex justify-center mb-5">
                <div
                  className="w-10 h-1 rounded-full"
                  style={{
                    background: isMinimal
                      ? "rgba(0,0,0,0.15)"
                      : "rgba(255,255,255,0.2)",
                  }}
                />
              </div>

              {/* Focus Score Hero */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.2,
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                  className="inline-flex flex-col items-center"
                >
                  {/* Focus ring */}
                  <div className="relative w-20 h-20 mb-3">
                    <svg width={80} height={80} viewBox="0 0 80 80">
                      <circle
                        cx={40}
                        cy={40}
                        r={34}
                        fill="none"
                        stroke={
                          isMinimal
                            ? "rgba(0,0,0,0.06)"
                            : "rgba(255,255,255,0.08)"
                        }
                        strokeWidth={4}
                      />
                      <motion.circle
                        cx={40}
                        cy={40}
                        r={34}
                        fill="none"
                        stroke={tierColor}
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 34}
                        initial={{
                          strokeDashoffset: 2 * Math.PI * 34,
                        }}
                        animate={{
                          strokeDashoffset:
                            2 * Math.PI * 34 * (1 - focusScore / 100),
                        }}
                        transition={{
                          delay: 0.3,
                          duration: 1.2,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        transform="rotate(-90 40 40)"
                      />
                    </svg>
                    <span
                      className="absolute inset-0 flex items-center justify-center text-xl font-bold"
                      style={{ color: tierColor }}
                    >
                      {focusScore}
                    </span>
                  </div>

                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-1"
                    style={{ color: tierColor }}
                  >
                    {tierLabel}
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: theme.textColor, opacity: 0.8 }}
                  >
                    {minutes} minute{minutes !== 1 ? "s" : ""} of focus
                  </p>
                </motion.div>
              </div>

              {/* Encouragement */}
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center text-sm font-medium mb-6 px-4 py-3 rounded-xl"
                style={{
                  color: theme.textColor,
                  opacity: 0.7,
                  background: isMinimal
                    ? "rgba(0,0,0,0.03)"
                    : "rgba(255,255,255,0.04)",
                  border: `1px solid ${border}`,
                }}
              >
                {encouragement}
              </motion.p>

              {/* Subject */}
              <div className="mb-5">
                <label
                  className="text-xs font-medium uppercase tracking-wider mb-2 block"
                  style={{ color: theme.textColor, opacity: 0.5 }}
                >
                  What did you work on?
                </label>
                {recentSubjects.length > 0 && (
                  <>
                    <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: theme.textColor, opacity: 0.35 }}>
                      Recent
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {recentSubjects.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSubject(s)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer"
                          style={{
                            background:
                              subject === s
                                ? theme.ringColor
                                : isMinimal
                                  ? "rgba(0,0,0,0.04)"
                                  : "rgba(255,255,255,0.06)",
                            color: subject === s ? "#ffffff" : theme.textColor,
                            opacity: subject === s ? 1 : 0.7,
                            boxShadow:
                              subject === s
                                ? `0 0 12px ${theme.glowColor}`
                                : "none",
                            border: `1px solid ${subject === s ? "transparent" : border}`,
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_SUBJECTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer"
                      style={{
                        background:
                          subject === s
                            ? theme.ringColor
                            : isMinimal
                              ? "rgba(0,0,0,0.04)"
                              : "rgba(255,255,255,0.06)",
                        color: subject === s ? "#ffffff" : theme.textColor,
                        opacity: subject === s ? 1 : 0.7,
                        boxShadow:
                          subject === s
                            ? `0 0 12px ${theme.glowColor}`
                            : "none",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus Rating */}
              <div className="mb-5">
                <label
                  className="text-xs font-medium uppercase tracking-wider mb-2 block"
                  style={{ color: theme.textColor, opacity: 0.5 }}
                >
                  How was your focus?
                </label>
                <div className="flex justify-between">
                  {FOCUS_RATINGS.map((r) => (
                    <motion.button
                      key={r.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setFocusRating(r.value)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer"
                      style={{
                        background:
                          focusRating === r.value
                            ? isMinimal
                              ? "rgba(6,182,212,0.1)"
                              : "rgba(255,255,255,0.08)"
                            : "transparent",
                        boxShadow:
                          focusRating === r.value
                            ? `0 0 10px ${theme.auraColor}`
                            : "none",
                      }}
                    >
                      <span className="text-2xl">{r.emoji}</span>
                      <span
                        className="text-[10px]"
                        style={{ color: theme.textColor, opacity: 0.5 }}
                      >
                        {r.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="mb-6">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What did you accomplish? (optional)"
                  rows={2}
                  className="w-full rounded-xl px-4 py-3 text-sm resize-none border-none outline-none"
                  style={{
                    background: isMinimal
                      ? "rgba(0,0,0,0.04)"
                      : "rgba(255,255,255,0.05)",
                    color: theme.textColor,
                    border: `1px solid ${border}`,
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onSkip}
                  className="flex-1 py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors"
                  style={{
                    background: isMinimal
                      ? "rgba(0,0,0,0.04)"
                      : "rgba(255,255,255,0.06)",
                    color: theme.textColor,
                    opacity: 0.7,
                    border: `1px solid ${border}`,
                  }}
                >
                  Skip
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{
                    background: theme.ringColor,
                    color: "#ffffff",
                    boxShadow: `0 4px 20px ${theme.glowColor}`,
                  }}
                >
                  Save Session
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
