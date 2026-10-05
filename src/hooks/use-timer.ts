"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type TimerMode = "pomodoro" | "deep_focus" | "stopwatch";

interface TimerState {
  mode: TimerMode;
  elapsed: number; // seconds elapsed
  target: number; // target seconds (0 for stopwatch)
  isRunning: boolean;
  isPaused: boolean;
  isComplete: boolean;
}

const MODE_DEFAULTS: Record<TimerMode, number> = {
  pomodoro: 25 * 60, // 25 minutes
  deep_focus: 50 * 60, // 50 minutes
  stopwatch: 0,
};

export function useTimer() {
  const [state, setState] = useState<TimerState>({
    mode: "pomodoro",
    elapsed: 0,
    target: MODE_DEFAULTS.pomodoro,
    isRunning: false,
    isPaused: false,
    isComplete: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedBeforePauseRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const now = Date.now();
    const elapsed = elapsedBeforePauseRef.current + Math.floor((now - startTimeRef.current) / 1000);

    setState((prev) => {
      if (prev.target > 0 && elapsed >= prev.target) {
        clearTimer();
        return { ...prev, elapsed: prev.target, isRunning: false, isPaused: false, isComplete: true };
      }
      return { ...prev, elapsed };
    });
  }, [clearTimer]);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    clearTimer();
    intervalRef.current = setInterval(tick, 250);
    setState((prev) => ({ ...prev, isRunning: true, isPaused: false, isComplete: false }));
  }, [tick, clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    elapsedBeforePauseRef.current = state.elapsed;
    setState((prev) => ({ ...prev, isRunning: false, isPaused: true }));
  }, [clearTimer, state.elapsed]);

  const resume = useCallback(() => {
    startTimeRef.current = Date.now();
    clearTimer();
    intervalRef.current = setInterval(tick, 250);
    setState((prev) => ({ ...prev, isRunning: true, isPaused: false }));
  }, [tick, clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    elapsedBeforePauseRef.current = 0;
    setState((prev) => ({
      ...prev,
      elapsed: 0,
      isRunning: false,
      isPaused: false,
      isComplete: false,
    }));
  }, [clearTimer]);

  const setMode = useCallback((mode: TimerMode) => {
    clearTimer();
    elapsedBeforePauseRef.current = 0;
    setState({
      mode,
      elapsed: 0,
      target: MODE_DEFAULTS[mode],
      isRunning: false,
      isPaused: false,
      isComplete: false,
    });
  }, [clearTimer]);

  const setCustomTarget = useCallback((minutes: number) => {
    setState((prev) => ({ ...prev, target: minutes * 60 }));
  }, []);

  // Remaining seconds for countdown modes
  const remaining = state.target > 0 ? Math.max(0, state.target - state.elapsed) : state.elapsed;
  const progress = state.target > 0 ? Math.min(1, state.elapsed / state.target) : 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    ...state,
    remaining,
    progress,
    start,
    pause,
    resume,
    reset,
    setMode,
    setCustomTarget,
  };
}
