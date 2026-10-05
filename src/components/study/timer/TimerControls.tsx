"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { type Theme } from "./themes";

interface TimerControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  onToggle: () => void;
  onReset: () => void;
  onSkip?: () => void;
  theme: Theme;
  hasElapsed: boolean;
  isBreak?: boolean;
}

export function TimerControls({
  isRunning,
  isPaused,
  onToggle,
  onReset,
  onSkip,
  theme,
  hasElapsed,
  isBreak,
}: TimerControlsProps) {
  const isMinimal = theme.id === "minimal";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="flex items-center gap-5 mt-8"
    >
      {/* Reset button */}
      <AnimatePresence>
        {hasElapsed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            onClick={onReset}
            className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-shadow duration-300"
            style={{
              background: isMinimal
                ? "rgba(0,0,0,0.05)"
                : "rgba(255,255,255,0.08)",
              boxShadow: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 0 20px ${theme.auraColor}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <RotateCcw
              className="h-4.5 w-4.5"
              style={{ color: theme.textColor, opacity: 0.6 }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main play/pause — larger, glowing */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.88 }}
        onClick={onToggle}
        className="relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer"
        style={{
          background: isRunning
            ? isMinimal
              ? "rgba(0,0,0,0.06)"
              : "rgba(255,255,255,0.12)"
            : isMinimal
              ? "rgba(6,182,212,0.1)"
              : "rgba(255,255,255,0.15)",
          boxShadow: isRunning
            ? `0 0 30px ${theme.auraColor}`
            : `0 0 0px transparent`,
          transition: "box-shadow 0.6s ease, background 0.3s ease",
        }}
      >
        {/* Active glow ring */}
        {isRunning && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                `0 0 15px ${theme.auraColor}`,
                `0 0 25px ${theme.auraColor}`,
                `0 0 15px ${theme.auraColor}`,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        <AnimatePresence mode="wait">
          {isRunning ? (
            <motion.div
              key="pause"
              initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <Pause
                className="h-5 w-5"
                style={{ color: theme.textColor }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="play"
              initial={{ opacity: 0, scale: 0.5, rotate: 90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: -90 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <Play
                className="h-5 w-5 ml-0.5"
                style={{ color: theme.textColor }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Skip button (for breaks) */}
      <AnimatePresence>
        {isBreak && onSkip && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            onClick={onSkip}
            className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-shadow duration-300"
            style={{
              background: isMinimal
                ? "rgba(0,0,0,0.05)"
                : "rgba(255,255,255,0.08)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 0 20px ${theme.auraColor}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <SkipForward
              className="h-4.5 w-4.5"
              style={{ color: theme.textColor, opacity: 0.6 }}
            />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
