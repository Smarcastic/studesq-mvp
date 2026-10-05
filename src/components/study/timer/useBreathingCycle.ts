"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shared breathing cycle hook — returns a value oscillating 0→1→0
 * synchronized to a rhythm that accelerates as time runs out.
 *
 * Breathing rate:
 * - Default: 4s per cycle
 * - Under 60s remaining: 2s per cycle
 * - Under 10s remaining: 1s per cycle (heartbeat)
 *
 * When paused, the cycle freezes at its current value.
 */
export function useBreathingCycle(
  secondsLeft: number,
  isRunning: boolean,
  isPaused: boolean
): number {
  const [breathValue, setBreathValue] = useState(0);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const lastFrameRef = useRef(0);

  useEffect(() => {
    // Freeze when not running or paused
    if (!isRunning || isPaused) return;

    lastFrameRef.current = performance.now();

    const animate = (now: number) => {
      const delta = (now - lastFrameRef.current) / 1000;
      lastFrameRef.current = now;

      // Accumulate time
      timeRef.current += delta;

      // Determine cycle speed based on time remaining
      let cycleDuration = 4; // 4 seconds per cycle
      if (secondsLeft <= 10 && secondsLeft > 0) {
        cycleDuration = 1; // heartbeat speed
      } else if (secondsLeft <= 60 && secondsLeft > 0) {
        cycleDuration = 2; // faster breathing
      }

      // Sine wave: 0→1→0 per cycle
      const frequency = (2 * Math.PI) / cycleDuration;
      const value = (Math.sin(timeRef.current * frequency) + 1) / 2; // normalize to 0-1

      setBreathValue(value);

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isRunning, isPaused, secondsLeft]);

  return breathValue;
}
