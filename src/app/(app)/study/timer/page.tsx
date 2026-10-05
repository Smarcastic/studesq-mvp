"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import {
  Settings,
  Maximize,
  Minimize,
  ArrowLeft,
  Clock,
  Zap,
  Timer,
} from "lucide-react";

import { THEMES, THEME_IDS, type ThemeId } from "@/components/study/timer/themes";
import { ThemeBackground } from "@/components/study/timer/ThemeBackground";
import { ThemePicker } from "@/components/study/timer/ThemePicker";
import { MercuryRing } from "@/components/study/timer/MercuryRing";
import { TimerDisplay } from "@/components/study/timer/TimerDisplay";
import { TimerControls } from "@/components/study/timer/TimerControls";
import { useTimerCore, type TimerMode } from "@/components/study/timer/TimerCore";
import { AmbientPlayer } from "@/components/study/timer/AmbientPlayer";
import { SettingsPanel } from "@/components/study/timer/SettingsPanel";
import { SessionLogger } from "@/components/study/timer/SessionLogger";
import { StatsBar } from "@/components/study/timer/StatsBar";
import { MomentumBar, calculateFocusScore, type FocusState } from "@/components/study/timer/MomentumBar";
import { CompletionSequence } from "@/components/study/timer/CompletionSequence";
import { useToast } from "@/components/ui/toast";
import { XP_REWARDS } from "@/lib/xp-system";
import { useBreathingCycle } from "@/components/study/timer/useBreathingCycle";
import { MilestoneCelebration } from "@/components/study/timer/MilestoneCelebration";

const MODE_TABS: { id: TimerMode; label: string; icon: React.ReactNode }[] = [
  { id: "pomodoro", label: "Pomodoro", icon: <Clock className="h-3.5 w-3.5" /> },
  { id: "deep_focus", label: "Deep Focus", icon: <Zap className="h-3.5 w-3.5" /> },
  { id: "stopwatch", label: "Stopwatch", icon: <Timer className="h-3.5 w-3.5" /> },
];

export default function FocusTimerPage() {
  const timer = useTimerCore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Theme — validate stored value against current theme keys
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    if (typeof window === "undefined") return "mercury";
    const stored = localStorage.getItem("timer-theme");
    if (stored && stored in THEMES) return stored as ThemeId;
    return "mercury";
  });
  const theme = THEMES[themeId];

  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogger, setShowLogger] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [currentSubject, setCurrentSubject] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Milestone celebrations
  const [milestone, setMilestone] = useState<number | null>(null);
  const lastMilestoneRef = useRef(0);

  // State transition detection
  const [transitionType, setTransitionType] = useState<"start" | "pause" | "resume" | null>(null);
  const prevRunningRef = useRef(false);
  const prevPausedRef = useRef(false);

  // Focus psychology state
  const [pauseCount, setPauseCount] = useState(0);
  const [totalPauseDuration, setTotalPauseDuration] = useState(0);
  const pauseStartRef = useRef<number | null>(null);

  // Pause streak: consecutive seconds running without pausing
  const [pauseStreak, setPauseStreak] = useState(0);
  const pauseStreakRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track pause streak (seconds without pausing while running)
  useEffect(() => {
    if (timer.isRunning && !timer.isPaused) {
      // Start counting seconds
      pauseStreakRef.current = setInterval(() => {
        setPauseStreak((s) => s + 1);
      }, 1000);
    } else {
      // Stop counting — reset streak on pause
      if (pauseStreakRef.current) {
        clearInterval(pauseStreakRef.current);
        pauseStreakRef.current = null;
      }
      if (timer.isPaused) setPauseStreak(0);
    }
    return () => {
      if (pauseStreakRef.current) clearInterval(pauseStreakRef.current);
    };
  }, [timer.isRunning, timer.isPaused]);

  // Track pauses
  useEffect(() => {
    if (timer.isPaused && !pauseStartRef.current) {
      // Just paused
      setPauseCount((c) => c + 1);
      pauseStartRef.current = Date.now();
    } else if (timer.isRunning && pauseStartRef.current) {
      // Resumed from pause
      const duration = (Date.now() - pauseStartRef.current) / 1000;
      setTotalPauseDuration((d) => d + duration);
      pauseStartRef.current = null;
    }
    // Clear pause ref if timer completed (prevents stale ref leaking to next session)
    if (timer.isComplete && pauseStartRef.current) {
      const duration = (Date.now() - pauseStartRef.current) / 1000;
      setTotalPauseDuration((d) => d + duration);
      pauseStartRef.current = null;
    }
  }, [timer.isPaused, timer.isRunning, timer.isComplete]);

  // Reset focus state on timer reset
  const originalReset = timer.reset;
  const resetWithFocusClear = useCallback(() => {
    originalReset();
    setPauseCount(0);
    setTotalPauseDuration(0);
    setPauseStreak(0);
    setCurrentSubject("");
    pauseStartRef.current = null;
  }, [originalReset]);

  // Smart reset: in stopwatch mode, show SessionLogger to save data instead of discarding
  const handleSmartReset = useCallback(() => {
    if (timer.mode === "stopwatch" && timer.elapsed > 10) {
      // Show the logger so the user can save their session
      timer.pause();
      setShowLogger(true);
    } else {
      resetWithFocusClear();
    }
  }, [timer, resetWithFocusClear]);

  // Compute focus score
  const totalDuration =
    timer.mode === "pomodoro"
      ? (timer.phase === "focus"
          ? timer.settings.focusDuration
          : timer.phase === "break"
            ? timer.settings.shortBreak
            : timer.settings.longBreak) * 60
      : timer.mode === "deep_focus"
        ? timer.deepFocusDuration * 60
        : Math.max(timer.elapsed, 1);

  const focusState: FocusState = {
    pauseCount,
    totalPauseDuration,
    elapsed: timer.elapsed,
    targetDuration: totalDuration,
  };

  // Today's stats
  const { data: todayStats } = useQuery({
    queryKey: ["study-sessions", "today"],
    queryFn: async () => {
      const res = await fetch("/api/study-sessions?limit=100");
      if (!res.ok) return { minutes: 0, sessions: 0, streak: 0, weeklyData: [] as number[] };
      const sessions = await res.json();
      const today = new Date().toDateString();
      const todaySessions = sessions.filter(
        (s: { completedAt: string }) =>
          new Date(s.completedAt).toDateString() === today
      );
      const totalMinutes = todaySessions.reduce(
        (sum: number, s: { duration: number }) =>
          sum + Math.floor(s.duration / 60),
        0
      );

      // Calculate streak (days in a row with sessions)
      let streak = 0;
      const sessionDates = new Set(
        sessions.map((s: { completedAt: string }) =>
          new Date(s.completedAt).toDateString()
        )
      );
      const d = new Date();
      while (sessionDates.has(d.toDateString())) {
        streak++;
        d.setDate(d.getDate() - 1);
      }

      // Calculate weekly data (Mon=0 ... Sun=6)
      const weeklyData = [0, 0, 0, 0, 0, 0, 0];
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - mondayOffset);
      monday.setHours(0, 0, 0, 0);

      sessions.forEach((s: { completedAt: string; duration: number }) => {
        const date = new Date(s.completedAt);
        if (date >= monday) {
          const wd = date.getDay();
          const idx = wd === 0 ? 6 : wd - 1;
          weeklyData[idx] += Math.floor(s.duration / 60);
        }
      });

      return {
        minutes: totalMinutes,
        sessions: todaySessions.length,
        streak,
        weeklyData,
      };
    },
  });

  const focusScore = calculateFocusScore(focusState, todayStats?.streak ?? 0);

  // Breathing cycle — shared rhythm for ring, background, display
  const breathValue = useBreathingCycle(timer.timeRemaining, timer.isRunning, timer.isPaused);

  // Milestone celebrations — fire every 5 minutes
  useEffect(() => {
    if (!timer.isRunning || timer.elapsed < 10) return;
    const currentMilestone = Math.floor(timer.elapsed / 300); // every 5 min
    if (currentMilestone > lastMilestoneRef.current && currentMilestone > 0) {
      const minutes = currentMilestone * 5;
      setMilestone(minutes);
      lastMilestoneRef.current = currentMilestone;
      // Small confetti burst for milestones
      confetti({
        particleCount: minutes >= 25 ? 60 : 30,
        spread: 50,
        origin: { y: 0.3 },
        colors: theme.confettiColors as unknown as string[],
      });
      // Auto-clear milestone after 2.5s
      const t = setTimeout(() => setMilestone(null), 2500);
      return () => clearTimeout(t);
    }
  }, [timer.elapsed, timer.isRunning, theme.confettiColors]);

  // Reset milestone counter on timer reset
  useEffect(() => {
    if (timer.elapsed === 0) lastMilestoneRef.current = 0;
  }, [timer.elapsed]);

  // State transition detection (start / pause / resume)
  useEffect(() => {
    const wasRunning = prevRunningRef.current;
    const wasPaused = prevPausedRef.current;
    const nowRunning = timer.isRunning;
    const nowPaused = timer.isPaused;

    if (!wasRunning && nowRunning && !wasPaused) {
      // Was idle, now running → START
      setTransitionType("start");
    } else if (wasRunning && !nowRunning && nowPaused) {
      // Was running, now paused → PAUSE
      setTransitionType("pause");
    } else if (wasPaused && nowRunning) {
      // Was paused, now running → RESUME
      setTransitionType("resume");
    }

    prevRunningRef.current = nowRunning;
    prevPausedRef.current = nowPaused;
  }, [timer.isRunning, timer.isPaused]);

  // Auto-clear transition type after animation duration
  useEffect(() => {
    if (transitionType) {
      const t = setTimeout(() => setTransitionType(null), 1200);
      return () => clearTimeout(t);
    }
  }, [transitionType]);

  // Estimate XP earned — uses actual flat reward values from XP_REWARDS
  const xpEstimate = useMemo(() => {
    const action = timer.mode === "deep_focus" ? "deep_focus_session" : "study_session";
    const reward = XP_REWARDS[action];
    return reward?.xp ?? 10;
  }, [timer.mode]);

  // Persist theme
  useEffect(() => {
    localStorage.setItem("timer-theme", themeId);
  }, [themeId]);

  // Save session mutation
  const saveMutation = useMutation({
    mutationFn: (data: {
      mode: string;
      duration: number;
      subject?: string;
      focusRating?: number;
      notes?: string;
      focusScore?: number;
    }) =>
      fetch("/api/study-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to save");
        return r.json();
      }),
    onSuccess: async () => {
      // Await invalidation so stats refetch BEFORE we reset the timer
      await queryClient.invalidateQueries({ queryKey: ["study-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["xp"] });
      toast("Session saved! \u2728");
      setShowLogger(false);
      resetWithFocusClear();
    },
    onError: () => toast("Failed to save session", "error"),
  });

  // On timer complete — show cinematic completion first
  useEffect(() => {
    timer.onCompleteRef.current = () => {
      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.6 },
        colors: theme.confettiColors as unknown as string[],
      });
      setShowCompletion(true);
    };
  }, [theme.confettiColors, timer.onCompleteRef]);

  // After completion sequence ends, show session logger
  const handleCompletionDone = useCallback(() => {
    setShowCompletion(false);
    setShowLogger(true);
  }, []);

  // On break start (pomodoro)
  useEffect(() => {
    timer.onBreakRef.current = () => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: theme.confettiColors as unknown as string[],
      });
      timer.startBreak();
    };
  }, [theme.confettiColors, timer.onBreakRef, timer.startBreak]);

  // Fullscreen helpers
  const enterFullscreen = useCallback(async () => {
    try {
      if (containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch {
      setIsFullscreen(false);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch {
      setIsFullscreen(false);
    }
  }, []);

  // Track fullscreen changes
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Auto-enter fullscreen on start
  useEffect(() => {
    if (timer.isRunning && !isFullscreen && !document.fullscreenElement) {
      enterFullscreen();
    }
  }, [timer.isRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cursor auto-hide in fullscreen when running
  const [cursorHidden, setCursorHidden] = useState(false);
  const cursorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isFullscreen || !timer.isRunning) {
      setCursorHidden(false);
      return;
    }

    const hideCursor = () => setCursorHidden(true);
    const showCursor = () => {
      setCursorHidden(false);
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);
      cursorTimerRef.current = setTimeout(hideCursor, 3000);
    };

    // Start hide timer
    cursorTimerRef.current = setTimeout(hideCursor, 3000);

    window.addEventListener("mousemove", showCursor);
    window.addEventListener("mousedown", showCursor);

    return () => {
      window.removeEventListener("mousemove", showCursor);
      window.removeEventListener("mousedown", showCursor);
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);
    };
  }, [isFullscreen, timer.isRunning]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (!showLogger && !showCompletion) timer.toggle();
          break;
        case "KeyR":
          if (!e.ctrlKey && !e.metaKey && !showLogger && !showCompletion) {
            e.preventDefault();
            handleSmartReset();
          }
          break;
        case "Escape":
          if (showCompletion) {
            handleCompletionDone();
          } else if (showSettings) {
            setShowSettings(false);
          } else if (!showLogger) {
            exitFullscreen();
          }
          break;
        case "KeyF":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (isFullscreen) exitFullscreen();
            else enterFullscreen();
          }
          break;
        case "Digit1":
          if (!e.ctrlKey && !timer.isRunning) setThemeId(THEME_IDS[0]);
          break;
        case "Digit2":
          if (!e.ctrlKey && !timer.isRunning) setThemeId(THEME_IDS[1]);
          break;
        case "Digit3":
          if (!e.ctrlKey && !timer.isRunning) setThemeId(THEME_IDS[2]);
          break;
        case "Digit4":
          if (!e.ctrlKey && !timer.isRunning) setThemeId(THEME_IDS[3]);
          break;
        case "Digit5":
          if (!e.ctrlKey && !timer.isRunning) setThemeId(THEME_IDS[4]);
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    timer,
    showSettings,
    showLogger,
    showCompletion,
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    handleSmartReset,
    handleCompletionDone,
  ]);

  // Handle session save
  const handleSessionSave = (data: {
    subject: string;
    focusRating: number;
    note: string;
    focusScore: number;
  }) => {
    if (timer.elapsed < 10) {
      toast("Session too short to save", "warning");
      setShowLogger(false);
      resetWithFocusClear();
      return;
    }
    saveMutation.mutate({
      mode: timer.mode,
      duration: timer.elapsed,
      subject: data.subject || currentSubject || undefined,
      focusRating: data.focusRating > 0 ? data.focusRating : undefined,
      notes: data.note || undefined,
      focusScore: data.focusScore,
    });
  };

  const handleSessionSkip = () => {
    setShowLogger(false);
    resetWithFocusClear();
  };

  const isMinimal = themeId === "minimal";
  const isBreak = timer.phase !== "focus";

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen select-none"
      style={{
        background: isMinimal ? "#ffffff" : "#000000",
        cursor: cursorHidden ? "none" : "auto",
      }}
    >
      {/* Background — parallax, vignette, focus reactivity, breathing */}
      <ThemeBackground
        themeId={themeId}
        isFullscreen={isFullscreen}
        isRunning={timer.isRunning}
        isPaused={timer.isPaused}
        focusScore={focusScore}
        breathValue={breathValue}
        elapsed={timer.elapsed}
      />

      {/* Top bar — fades in fullscreen when running */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{
          opacity: isFullscreen && timer.isRunning ? 0 : 1,
          y: 0,
        }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="relative z-10 flex items-center justify-between px-6 py-4"
        style={{
          pointerEvents: isFullscreen && timer.isRunning ? "none" : "auto",
        }}
        onMouseEnter={(e) => {
          // Re-show on hover even in fullscreen
          if (isFullscreen && timer.isRunning) {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.pointerEvents = "auto";
          }
        }}
        onMouseLeave={(e) => {
          if (isFullscreen && timer.isRunning) {
            e.currentTarget.style.opacity = "0";
            e.currentTarget.style.pointerEvents = "none";
          }
        }}
      >
        {/* Left: Back + Mode tabs */}
        <div className="flex items-center gap-4">
          <motion.a
            href="/study/timer"
            onClick={(e) => {
              e.preventDefault();
              if (isFullscreen) exitFullscreen();
              window.history.back();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full cursor-pointer"
            style={{
              background: isMinimal
                ? "rgba(0,0,0,0.04)"
                : "rgba(255,255,255,0.08)",
            }}
          >
            <ArrowLeft
              className="h-4 w-4"
              style={{ color: theme.textColor, opacity: 0.7 }}
            />
          </motion.a>

          {/* Mode tabs */}
          <div
            className="flex items-center gap-0.5 p-1 rounded-xl"
            style={{
              background: isMinimal
                ? "rgba(0,0,0,0.04)"
                : "rgba(255,255,255,0.06)",
            }}
          >
            {MODE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (!timer.isRunning) {
                    timer.setMode(tab.id);
                    setPauseCount(0);
                    setTotalPauseDuration(0);
                    setPauseStreak(0);
                  }
                }}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                style={{
                  color: theme.textColor,
                  opacity: timer.mode === tab.id ? 1 : 0.5,
                }}
              >
                {timer.mode === tab.id && (
                  <motion.div
                    layoutId="active-mode"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: isMinimal
                        ? "rgba(6,182,212,0.1)"
                        : "rgba(255,255,255,0.1)",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                    }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Theme, Sound, Settings, Fullscreen */}
        <div className="flex items-center gap-2">
          <ThemePicker activeTheme={themeId} onSelect={setThemeId} />

          <AmbientPlayer isRunning={timer.isRunning} theme={theme} />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full cursor-pointer transition-shadow duration-300"
            style={{
              background: isMinimal
                ? "rgba(0,0,0,0.04)"
                : "rgba(255,255,255,0.08)",
            }}
          >
            <Settings
              className="h-4 w-4"
              style={{ color: theme.textColor, opacity: 0.7 }}
            />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              isFullscreen ? exitFullscreen() : enterFullscreen()
            }
            className="p-2 rounded-full cursor-pointer transition-shadow duration-300"
            style={{
              background: isMinimal
                ? "rgba(0,0,0,0.04)"
                : "rgba(255,255,255,0.08)",
            }}
          >
            {isFullscreen ? (
              <Minimize
                className="h-4 w-4"
                style={{ color: theme.textColor, opacity: 0.7 }}
              />
            ) : (
              <Maximize
                className="h-4 w-4"
                style={{ color: theme.textColor, opacity: 0.7 }}
              />
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Center: Ring + Time + Controls + Momentum */}
      <div
        className="relative z-10 flex flex-col items-center justify-center"
        style={{ minHeight: "calc(100vh - 140px)" }}
      >
        {/* Timer ring + display */}
        <div className="relative">
          <MercuryRing
            progress={timer.progress}
            theme={theme}
            isRunning={timer.isRunning}
            isPaused={timer.isPaused}
            isComplete={timer.isComplete}
            size={300}
            secondsLeft={timer.timeRemaining}
            focusScore={focusScore}
            elapsed={timer.elapsed}
            pauseStreak={pauseStreak}
            breathValue={breathValue}
            milestone={milestone}
            transitionType={transitionType}
          />
          <TimerDisplay
            timeInSeconds={
              timer.mode === "stopwatch"
                ? timer.elapsed
                : timer.timeRemaining
            }
            isCountUp={timer.mode === "stopwatch"}
            mode={timer.mode}
            sessionNumber={timer.sessionNumber}
            totalSessions={timer.totalSessions}
            isBreak={isBreak}
            isRunning={timer.isRunning}
            isPaused={timer.isPaused}
            theme={theme}
            focusScore={
              timer.isRunning && timer.elapsed > 15 ? focusScore : undefined
            }
            secondsLeft={timer.timeRemaining}
            breathValue={breathValue}
          />
        </div>

        {/* Subject Input — shown when not running */}
        <AnimatePresence>
          {!timer.isRunning && !timer.isPaused && !showCompletion && !showLogger && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="mt-4 mb-1"
            >
              <input
                type="text"
                value={currentSubject}
                onChange={(e) => setCurrentSubject(e.target.value)}
                placeholder="What are you studying?"
                className="text-center text-sm font-medium rounded-xl px-5 py-2.5 outline-none transition-all w-64"
                style={{
                  background: isMinimal
                    ? "rgba(0,0,0,0.04)"
                    : "rgba(255,255,255,0.06)",
                  border: `1px solid ${theme.surfaceBorder}`,
                  color: theme.textColor,
                  backdropFilter: "blur(8px)",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                    timer.toggle();
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subject label — shown while running */}
        <AnimatePresence>
          {(timer.isRunning || timer.isPaused) && currentSubject && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 mb-1 text-xs font-medium tracking-wider uppercase"
              style={{ color: theme.textColor, opacity: 0.4 }}
            >
              {currentSubject}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Controls */}
        <TimerControls
          isRunning={timer.isRunning}
          isPaused={timer.isPaused}
          onToggle={timer.toggle}
          onReset={handleSmartReset}
          onSkip={
            isBreak ? () => timer.startNextSession() : undefined
          }
          theme={theme}
          hasElapsed={timer.elapsed > 0}
          isBreak={isBreak}
        />

        {/* Deep focus slider */}
        <AnimatePresence>
          {timer.mode === "deep_focus" &&
            !timer.isRunning &&
            !timer.isPaused && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6 flex items-center gap-3"
              >
                <span
                  className="text-xs font-medium"
                  style={{ color: theme.textColor, opacity: 0.5 }}
                >
                  {timer.deepFocusDuration} min
                </span>
                <input
                  type="range"
                  min={5}
                  max={120}
                  step={5}
                  value={timer.deepFocusDuration}
                  onChange={(e) =>
                    timer.updateDeepFocusDuration(parseInt(e.target.value))
                  }
                  className="w-40 h-1 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${theme.ringColor} 0%, ${theme.ringColor} ${((timer.deepFocusDuration - 5) / 115) * 100}%, ${isMinimal ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)"} ${((timer.deepFocusDuration - 5) / 115) * 100}%, ${isMinimal ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)"} 100%)`,
                  }}
                />
              </motion.div>
            )}
        </AnimatePresence>

        {/* Momentum Bar — shows during active session */}
        <AnimatePresence>
          {(timer.isRunning || timer.isPaused) && timer.elapsed > 10 && (
            <MomentumBar
              theme={theme}
              focusScore={focusScore}
              elapsed={timer.elapsed}
              pauseCount={pauseCount}
              streak={todayStats?.sessions ?? 0}
              isRunning={timer.isRunning}
            />
          )}
        </AnimatePresence>

        {/* Break actions (pomodoro) */}
        <AnimatePresence>
          {timer.isComplete &&
            timer.mode === "pomodoro" &&
            timer.phase !== "focus" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 flex gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setPauseCount(0);
                    setTotalPauseDuration(0);
                    setPauseStreak(0);
                    timer.startNextSession();
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{
                    background: theme.ringColor,
                    color: "#ffffff",
                    boxShadow: `0 4px 20px ${theme.glowColor}`,
                  }}
                >
                  Start Next Session
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowLogger(true)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                  style={{
                    background: isMinimal
                      ? "rgba(0,0,0,0.05)"
                      : "rgba(255,255,255,0.08)",
                    color: theme.textColor,
                    border: `1px solid ${theme.surfaceBorder}`,
                  }}
                >
                  End Session
                </motion.button>
              </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Bottom: Stats — real-time: adds current session elapsed to totals */}
      <div className="relative z-10 pb-6">
        <StatsBar
          theme={theme}
          todayMinutes={
            (todayStats?.minutes ?? 0) +
            (timer.isRunning || timer.isPaused ? Math.floor(timer.elapsed / 60) : 0)
          }
          todaySessions={todayStats?.sessions ?? 0}
          streak={todayStats?.streak ?? 0}
          weeklyData={todayStats?.weeklyData}
        />
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={timer.settings}
        onUpdate={timer.updateSettings}
        deepFocusDuration={timer.deepFocusDuration}
        onDeepFocusChange={timer.updateDeepFocusDuration}
        theme={theme}
      />

      {/* Milestone Celebrations */}
      <MilestoneCelebration
        milestone={milestone}
        theme={theme}
        focusScore={focusScore}
      />

      {/* Cinematic Completion Sequence */}
      <CompletionSequence
        show={showCompletion}
        theme={theme}
        focusScore={focusScore}
        duration={timer.elapsed}
        xpEarned={xpEstimate}
        streak={todayStats?.sessions ?? 0}
        onDone={handleCompletionDone}
      />

      {/* Session Logger */}
      <SessionLogger
        open={showLogger}
        onSave={handleSessionSave}
        onSkip={handleSessionSkip}
        duration={timer.elapsed}
        theme={theme}
        focusScore={focusScore}
        streak={todayStats?.sessions ?? 0}
        defaultSubject={currentSubject}
      />
    </div>
  );
}
