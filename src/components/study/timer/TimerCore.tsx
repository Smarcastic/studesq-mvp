"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type TimerMode = "pomodoro" | "deep_focus" | "stopwatch";
export type TimerPhase = "focus" | "break" | "long_break";

export interface PomodoroSettings {
  focusDuration: number;  // minutes
  shortBreak: number;
  longBreak: number;
  sessionsBeforeLong: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLong: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
};

export interface TimerState {
  mode: TimerMode;
  phase: TimerPhase;
  timeRemaining: number;   // seconds (countdown)
  elapsed: number;          // seconds (total elapsed in current session)
  isRunning: boolean;
  isPaused: boolean;
  isComplete: boolean;
  sessionNumber: number;
  totalSessions: number;
  progress: number;         // 0-1
  settings: PomodoroSettings;
  deepFocusDuration: number; // minutes
}

export function useTimerCore() {
  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    const saved = localStorage.getItem("timer-settings");
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [mode, setModeState] = useState<TimerMode>("pomodoro");
  const [phase, setPhase] = useState<TimerPhase>("focus");
  const [timeRemaining, setTimeRemaining] = useState(settings.focusDuration * 60);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionNumber, setSessionNumber] = useState(1);
  const [deepFocusDuration, setDeepFocusDuration] = useState(50);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);
  const onBreakRef = useRef<(() => void) | null>(null);

  // Use refs for mode/phase to avoid stale closures in interval callback
  const modeRef = useRef(mode);
  const phaseRef = useRef(phase);
  modeRef.current = mode;
  phaseRef.current = phase;

  // Wall-clock anchors for drift-proof timing
  const startTimeRef = useRef<number>(0);
  const elapsedBeforePauseRef = useRef(0);
  const initialTimeRemainingRef = useRef(0);

  const totalDuration = mode === "pomodoro"
    ? (phase === "focus" ? settings.focusDuration : phase === "break" ? settings.shortBreak : settings.longBreak) * 60
    : mode === "deep_focus"
      ? deepFocusDuration * 60
      : 0;

  const progress = mode === "stopwatch"
    ? 1
    : totalDuration > 0
      ? 1 - timeRemaining / totalDuration
      : 0;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Tick — uses Date.now() to prevent setInterval drift
  useEffect(() => {
    if (!isRunning) return;

    // Anchor the wall-clock start time
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const wallElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const newElapsed = elapsedBeforePauseRef.current + wallElapsed;

      if (modeRef.current === "stopwatch") {
        setElapsed(newElapsed);
        setTimeRemaining(newElapsed);
      } else {
        const newRemaining = Math.max(0, initialTimeRemainingRef.current - wallElapsed);
        setTimeRemaining(newRemaining);
        setElapsed(newElapsed);

        if (newRemaining <= 0) {
          setIsRunning(false);
          setIsComplete(true);
          clearTimer();

          if (modeRef.current === "pomodoro" && phaseRef.current === "focus") {
            onBreakRef.current?.();
          } else {
            onCompleteRef.current?.();
          }
        }
      }
    }, 250); // Check every 250ms for accuracy, update state with wall-clock values

    return clearTimer;
  }, [isRunning, clearTimer]);

  const start = useCallback(() => {
    // Snapshot current remaining time so the interval knows the countdown baseline
    setTimeRemaining((prev) => {
      initialTimeRemainingRef.current = prev;
      return prev;
    });
    setIsRunning(true);
    setIsPaused(false);
    setIsComplete(false);
  }, []);

  const pause = useCallback(() => {
    // Freeze elapsed so far so next start() resumes from here
    const wallElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    elapsedBeforePauseRef.current += wallElapsed;
    setIsRunning(false);
    setIsPaused(true);
    clearTimer();
  }, [clearTimer]);

  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, start, pause]);

  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setIsPaused(false);
    setIsComplete(false);
    setElapsed(0);
    elapsedBeforePauseRef.current = 0;
    startTimeRef.current = 0;
    if (mode === "pomodoro") {
      setPhase("focus");
      const t = settings.focusDuration * 60;
      setTimeRemaining(t);
      initialTimeRemainingRef.current = t;
    } else if (mode === "deep_focus") {
      const t = deepFocusDuration * 60;
      setTimeRemaining(t);
      initialTimeRemainingRef.current = t;
    } else {
      setTimeRemaining(0);
      initialTimeRemainingRef.current = 0;
    }
  }, [clearTimer, mode, settings.focusDuration, deepFocusDuration]);

  const setMode = useCallback((newMode: TimerMode) => {
    clearTimer();
    setModeState(newMode);
    setIsRunning(false);
    setIsPaused(false);
    setIsComplete(false);
    setElapsed(0);
    setPhase("focus");
    setSessionNumber(1);
    elapsedBeforePauseRef.current = 0;
    startTimeRef.current = 0;

    if (newMode === "pomodoro") {
      const t = settings.focusDuration * 60;
      setTimeRemaining(t);
      initialTimeRemainingRef.current = t;
    } else if (newMode === "deep_focus") {
      const t = deepFocusDuration * 60;
      setTimeRemaining(t);
      initialTimeRemainingRef.current = t;
    } else {
      setTimeRemaining(0);
      initialTimeRemainingRef.current = 0;
    }
  }, [clearTimer, settings.focusDuration, deepFocusDuration]);

  const startBreak = useCallback(() => {
    const isLongBreak = sessionNumber % settings.sessionsBeforeLong === 0;
    const breakPhase: TimerPhase = isLongBreak ? "long_break" : "break";
    const breakDuration = isLongBreak ? settings.longBreak : settings.shortBreak;
    const t = breakDuration * 60;

    setPhase(breakPhase);
    setTimeRemaining(t);
    setElapsed(0);
    setIsComplete(false);
    setIsPaused(false);
    elapsedBeforePauseRef.current = 0;
    initialTimeRemainingRef.current = t;

    if (settings.autoStartBreaks) {
      setIsRunning(true);
    }
  }, [sessionNumber, settings]);

  const startNextSession = useCallback(() => {
    const t = settings.focusDuration * 60;
    setSessionNumber((n) => n + 1);
    setPhase("focus");
    setTimeRemaining(t);
    setElapsed(0);
    setIsComplete(false);
    setIsPaused(false);
    elapsedBeforePauseRef.current = 0;
    initialTimeRemainingRef.current = t;

    if (settings.autoStartFocus) {
      setIsRunning(true);
    }
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<PomodoroSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("timer-settings", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateDeepFocusDuration = useCallback((minutes: number) => {
    setDeepFocusDuration(minutes);
    if (!isRunning && !isPaused) {
      setTimeRemaining(minutes * 60);
    }
  }, [isRunning, isPaused]);

  return {
    mode,
    phase,
    timeRemaining,
    elapsed,
    isRunning,
    isPaused,
    isComplete,
    sessionNumber,
    totalSessions: settings.sessionsBeforeLong,
    progress,
    settings,
    deepFocusDuration,
    start,
    pause,
    toggle,
    reset,
    setMode,
    startBreak,
    startNextSession,
    updateSettings,
    updateDeepFocusDuration,
    onCompleteRef,
    onBreakRef,
  };
}
