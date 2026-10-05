"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Calendar,
  BarChart3,
  Flame,
  Moon,
  Target,
  Rocket,
  Timer,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { FadeUp, StaggerList, StaggerItem, CountUp } from "@/components/ui/motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StudySession {
  id: string;
  mode: "pomodoro" | "deep_focus" | "stopwatch";
  duration: number;
  subject?: string | null;
  notes?: string | null;
  mood?: string | null;
  completedAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function modeLabel(mode: StudySession["mode"]): string {
  switch (mode) {
    case "pomodoro": return "Pomodoro";
    case "deep_focus": return "Deep Focus";
    case "stopwatch": return "Stopwatch";
  }
}

function modeBadgeVariant(mode: StudySession["mode"]) {
  switch (mode) {
    case "pomodoro": return "error" as const;
    case "deep_focus": return "teal" as const;
    case "stopwatch": return "warning" as const;
  }
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

const SUBJECT_COLORS = [
  "bg-cyan-500", "bg-teal-500", "bg-indigo-500", "bg-amber-500", "bg-rose-500",
  "bg-violet-500", "bg-emerald-500", "bg-sky-500", "bg-orange-500", "bg-fuchsia-500",
];

const HEATMAP_LEVELS = [
  "bg-slate-100",       // 0 — no study
  "bg-cyan-100",        // level 1
  "bg-cyan-200",        // level 2
  "bg-cyan-400",        // level 3
  "bg-cyan-600",        // level 4
];

const TIME_RANGE_TABS = [
  { id: "7", label: "7 Days" },
  { id: "30", label: "30 Days" },
  { id: "all", label: "All Time" },
];

type FocusPersonality = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  color: string;
  bgColor: string;
};

const PERSONALITIES: Record<string, FocusPersonality> = {
  night_owl: {
    id: "night_owl",
    label: "Night Owl",
    emoji: "🦉",
    description: "You do your best work after hours. Most of your focus sessions happen in the evening or night.",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
  },
  consistent_grinder: {
    id: "consistent_grinder",
    label: "Consistent Grinder",
    emoji: "⚙️",
    description: "Steady and reliable. You study consistently throughout the week with even daily distribution.",
    color: "text-cyan-700",
    bgColor: "bg-cyan-50",
  },
  burst_sprinter: {
    id: "burst_sprinter",
    label: "Burst Sprinter",
    emoji: "⚡",
    description: "You prefer intense bursts of deep focus. High peaks followed by rest — quality over quantity.",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
  },
  weekend_warrior: {
    id: "weekend_warrior",
    label: "Weekend Warrior",
    emoji: "🏋️",
    description: "Weekends are your power zone. You pack most of your study time into Saturday and Sunday.",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
  },
};

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

async function fetchSessions(): Promise<StudySession[]> {
  const res = await fetch("/api/study-sessions?limit=500");
  if (!res.ok) throw new Error("Failed to fetch study sessions");
  return res.json();
}

// ---------------------------------------------------------------------------
// Animated Counter Component (for growth percentages)
// ---------------------------------------------------------------------------

function GrowthBadge({ value, label }: { value: number; label: string }) {
  const isPositive = value > 0;
  const isZero = value === 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
        isZero
          ? "bg-slate-50 text-slate-500"
          : isPositive
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-600"
      }`}
    >
      {!isZero && (
        isPositive ? (
          <ArrowUpRight className="h-3 w-3" />
        ) : (
          <ArrowDownRight className="h-3 w-3" />
        )
      )}
      <span>
        {isPositive ? "+" : ""}
        {value}% {label}
      </span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const [range, setRange] = useState("7");

  const { data: sessions, isLoading } = useQuery<StudySession[]>({
    queryKey: ["study-sessions", "analytics"],
    queryFn: fetchSessions,
  });

  // ---- Filter by date range ----
  const filtered = useMemo(() => {
    if (!sessions) return [];
    if (range === "all") return sessions;
    const days = parseInt(range, 10);
    const cutoff = daysAgo(days);
    return sessions.filter((s) => new Date(s.completedAt) >= cutoff);
  }, [sessions, range]);

  // ---- Summary stats ----
  const stats = useMemo(() => {
    const totalSeconds = filtered.reduce((a, s) => a + s.duration, 0);
    const count = filtered.length;
    const avgSeconds = count > 0 ? totalSeconds / count : 0;
    const longestSeconds = count > 0 ? Math.max(...filtered.map((s) => s.duration)) : 0;

    return {
      totalHours: parseFloat((totalSeconds / 3600).toFixed(1)),
      count,
      avgMinutes: Math.round(avgSeconds / 60),
      longestMinutes: Math.round(longestSeconds / 60),
    };
  }, [filtered]);

  // ---- Weekly Growth (last 7d vs previous 7d) ----
  const growth = useMemo(() => {
    if (!sessions || sessions.length === 0) return { focusTime: 0, sessions: 0 };

    const now = new Date();
    const last7 = daysAgo(7);
    const prev7 = daysAgo(14);

    const last7Sessions = sessions.filter((s) => {
      const d = new Date(s.completedAt);
      return d >= last7 && d <= now;
    });
    const prev7Sessions = sessions.filter((s) => {
      const d = new Date(s.completedAt);
      return d >= prev7 && d < last7;
    });

    const last7Time = last7Sessions.reduce((a, s) => a + s.duration, 0);
    const prev7Time = prev7Sessions.reduce((a, s) => a + s.duration, 0);

    const focusTimeGrowth = prev7Time > 0
      ? Math.round(((last7Time - prev7Time) / prev7Time) * 100)
      : last7Time > 0 ? 100 : 0;

    const sessionsGrowth = prev7Sessions.length > 0
      ? Math.round(((last7Sessions.length - prev7Sessions.length) / prev7Sessions.length) * 100)
      : last7Sessions.length > 0 ? 100 : 0;

    return { focusTime: focusTimeGrowth, sessions: sessionsGrowth };
  }, [sessions]);

  // ---- Daily chart data ----
  const dailyData = useMemo(() => {
    if (filtered.length === 0) return [];
    const days = range === "all" ? 30 : parseInt(range, 10);
    const map = new Map<string, number>();

    for (let i = days - 1; i >= 0; i--) {
      const d = daysAgo(i);
      map.set(dateKey(d), 0);
    }

    filtered.forEach((s) => {
      const key = dateKey(new Date(s.completedAt));
      if (map.has(key)) map.set(key, (map.get(key) || 0) + s.duration);
    });

    return Array.from(map.entries()).map(([ds, seconds]) => {
      const d = new Date(ds + "T00:00:00");
      return {
        date: ds,
        dayLabel: d.toLocaleDateString("en-US", { weekday: "short" }),
        dateLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        minutes: Math.round(seconds / 60),
      };
    });
  }, [filtered, range]);

  const maxMinutes = useMemo(() => Math.max(1, ...dailyData.map((d) => d.minutes)), [dailyData]);

  // ---- Subject breakdown ----
  const subjectData = useMemo(() => {
    if (filtered.length === 0) return [];
    const map = new Map<string, number>();
    filtered.forEach((s) => {
      const key = s.subject || "No subject";
      map.set(key, (map.get(key) || 0) + s.duration);
    });
    const total = filtered.reduce((a, s) => a + s.duration, 0);
    return Array.from(map.entries())
      .map(([subject, seconds]) => ({
        subject,
        seconds,
        percent: total > 0 ? Math.round((seconds / total) * 100) : 0,
      }))
      .sort((a, b) => b.seconds - a.seconds);
  }, [filtered]);

  // ---- Mode breakdown ----
  const modeData = useMemo(() => {
    const modes: StudySession["mode"][] = ["pomodoro", "deep_focus", "stopwatch"];
    return modes.map((m) => {
      const ms = filtered.filter((s) => s.mode === m);
      return { mode: m, count: ms.length, totalSeconds: ms.reduce((a, s) => a + s.duration, 0) };
    });
  }, [filtered]);

  const maxModeSeconds = useMemo(() => Math.max(1, ...modeData.map((m) => m.totalSeconds)), [modeData]);

  // ---- Subject Heatmap (last 90 days, grouped by week) ----
  const heatmapData = useMemo(() => {
    if (!sessions || sessions.length === 0) return { weeks: [], maxMinutes: 1 };

    const days = 91; // 13 weeks
    const dayMap = new Map<string, number>();

    for (let i = days - 1; i >= 0; i--) {
      dayMap.set(dateKey(daysAgo(i)), 0);
    }

    sessions.forEach((s) => {
      const key = dateKey(new Date(s.completedAt));
      if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) || 0) + s.duration);
    });

    const entries = Array.from(dayMap.entries()).map(([ds, sec]) => ({
      date: ds,
      minutes: Math.round(sec / 60),
      dayOfWeek: new Date(ds + "T00:00:00").getDay(),
    }));

    // Group by weeks
    const weeks: typeof entries[] = [];
    let currentWeek: typeof entries = [];
    entries.forEach((e) => {
      if (e.dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(e);
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);

    const hMax = Math.max(1, ...entries.map((e) => e.minutes));

    return { weeks, maxMinutes: hMax };
  }, [sessions]);

  const getHeatmapLevel = useCallback((minutes: number, max: number) => {
    if (minutes === 0) return 0;
    const ratio = minutes / max;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  }, []);

  // ---- Focus Personality ----
  const personality = useMemo((): FocusPersonality | null => {
    if (!sessions || sessions.length < 5) return null;

    const last30 = sessions.filter((s) => new Date(s.completedAt) >= daysAgo(30));
    if (last30.length < 3) return null;

    // Analyze time-of-day distribution
    const hourBuckets = new Array(24).fill(0);
    last30.forEach((s) => {
      const hour = new Date(s.completedAt).getHours();
      hourBuckets[hour] += s.duration;
    });

    const eveningTime = hourBuckets.slice(18, 24).reduce((a, b) => a + b, 0)
      + hourBuckets.slice(0, 4).reduce((a, b) => a + b, 0);
    const totalTime = hourBuckets.reduce((a, b) => a + b, 0);
    const eveningRatio = totalTime > 0 ? eveningTime / totalTime : 0;

    // Analyze day-of-week distribution
    const dayBuckets = new Array(7).fill(0);
    last30.forEach((s) => {
      const dow = new Date(s.completedAt).getDay();
      dayBuckets[dow] += s.duration;
    });
    const weekendTime = dayBuckets[0] + dayBuckets[6];
    const weekdayTime = dayBuckets.slice(1, 6).reduce((a, b) => a + b, 0);
    const weekendRatio = totalTime > 0 ? weekendTime / totalTime : 0;

    // Analyze consistency (standard deviation of daily minutes)
    const dailyMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      dailyMap.set(dateKey(daysAgo(i)), 0);
    }
    last30.forEach((s) => {
      const key = dateKey(new Date(s.completedAt));
      if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) || 0) + s.duration / 60);
    });
    const dailyMins = Array.from(dailyMap.values());
    const mean = dailyMins.reduce((a, b) => a + b, 0) / dailyMins.length;
    const variance = dailyMins.reduce((a, v) => a + (v - mean) ** 2, 0) / dailyMins.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 999; // coefficient of variation

    // Analyze session length (burst detection)
    const avgDuration = last30.reduce((a, s) => a + s.duration, 0) / last30.length;
    const longSessions = last30.filter((s) => s.duration > 2700).length; // >45 min
    const burstRatio = last30.length > 0 ? longSessions / last30.length : 0;

    // Classification logic
    if (eveningRatio >= 0.5) return PERSONALITIES.night_owl;
    if (weekendRatio >= 0.55) return PERSONALITIES.weekend_warrior;
    if (cv < 0.8 && mean > 10) return PERSONALITIES.consistent_grinder;
    if (burstRatio >= 0.4 || avgDuration > 2400) return PERSONALITIES.burst_sprinter;
    if (cv < 1.2) return PERSONALITIES.consistent_grinder;

    return PERSONALITIES.burst_sprinter;
  }, [sessions]);

  // ---- Streak & Streak Protection ----
  const streakInfo = useMemo(() => {
    if (!sessions || sessions.length === 0) return { current: 0, atRisk: false };

    const daySet = new Set<string>();
    sessions.forEach((s) => daySet.add(dateKey(new Date(s.completedAt))));

    const todayKey = dateKey(new Date());
    const yesterdayKey = dateKey(daysAgo(1));

    // If studied today, start counting from today backwards
    // If not studied today, start from yesterday
    let streak = 0;
    const studiedToday = daySet.has(todayKey);
    const startFrom = studiedToday ? 0 : 1;

    for (let i = startFrom; i < 365; i++) {
      const key = dateKey(daysAgo(i));
      if (daySet.has(key)) {
        streak++;
      } else {
        break;
      }
    }

    // Streak at risk: haven't studied today but had a streak yesterday
    const atRisk = !studiedToday && streak > 0;

    return { current: streak, atRisk };
  }, [sessions]);

  // ---- Recent sessions ----
  const recentSessions = useMemo(() => {
    return [...filtered]
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 10);
  }, [filtered]);

  // ---- Loading state ----
  if (isLoading) {
    return (
      <div>
        <PageHeader title="Study Analytics" description="Your growth dashboard — track patterns, insights & progress." />
        <div className="space-y-6">
          <Skeleton className="h-10 w-72" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-[14px]" />)}
          </div>
          <Skeleton className="h-64 rounded-[14px]" />
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="h-48 rounded-[14px]" />
            <Skeleton className="h-48 rounded-[14px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div>
        <PageHeader title="Study Analytics" description="Your growth dashboard — track patterns, insights & progress." />
        <FadeUp>
          <Card>
            <EmptyState
              icon={<BarChart3 className="h-12 w-12" />}
              title="No study sessions yet"
              description="Complete your first study session to unlock analytics, insights, and your focus personality."
            />
          </Card>
        </FadeUp>
      </div>
    );
  }

  const statCards = [
    { label: "Total Hours", value: stats.totalHours, decimals: 1, suffix: "h", icon: <Clock className="h-5 w-5 text-white" />, bg: "bg-cyan-500" },
    { label: "Sessions", value: stats.count, decimals: 0, suffix: "", icon: <Zap className="h-5 w-5 text-white" />, bg: "bg-teal-500" },
    { label: "Avg Session", value: stats.avgMinutes, decimals: 0, suffix: "m", icon: <TrendingUp className="h-5 w-5 text-white" />, bg: "bg-indigo-500" },
    { label: "Longest", value: stats.longestMinutes, decimals: 0, suffix: "m", icon: <Calendar className="h-5 w-5 text-white" />, bg: "bg-amber-500" },
  ];

  return (
    <div>
      <PageHeader title="Study Analytics" description="Your growth dashboard — track patterns, insights & progress." />

      {/* ---- Streak Protection Banner ---- */}
      <AnimatePresence>
        {streakInfo.atRisk && streakInfo.current >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -12, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800">
                  Your {streakInfo.current}-day streak is at risk!
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Study today to keep your streak alive. Don&apos;t break the chain.
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Flame className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-bold text-amber-700">{streakInfo.current}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Time range tabs + Weekly Growth ---- */}
      <FadeUp>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <Tabs tabs={TIME_RANGE_TABS} activeTab={range} onChange={setRange} />
          <AnimatePresence mode="wait">
            <motion.div
              key={range}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2"
            >
              <GrowthBadge value={growth.focusTime} label="focus time" />
              <GrowthBadge value={growth.sessions} label="sessions" />
            </motion.div>
          </AnimatePresence>
        </div>
      </FadeUp>

      {/* ---- Empty filtered state ---- */}
      {filtered.length === 0 ? (
        <FadeUp delay={0.1}>
          <Card>
            <EmptyState
              icon={<BarChart3 className="h-12 w-12" />}
              title="No sessions in this period"
              description="Try selecting a wider time range to see your study data."
            />
          </Card>
        </FadeUp>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={range}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            {/* ---- Streak + Personality Row ---- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Streak Card */}
              <FadeUp>
                <Card className="flex items-center gap-4">
                  <motion.div
                    className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0"
                    animate={streakInfo.current > 0 ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Flame className="h-6 w-6 text-orange-500" />
                  </motion.div>
                  <div>
                    <CountUp
                      value={streakInfo.current}
                      suffix=" day streak"
                      className="text-xl font-bold text-slate-900"
                    />
                    <p className="text-sm text-slate-500">
                      {streakInfo.current === 0
                        ? "Start studying to build a streak"
                        : streakInfo.atRisk
                        ? "Study today to keep it going!"
                        : "Keep the momentum going"}
                    </p>
                  </div>
                </Card>
              </FadeUp>

              {/* Focus Personality Card */}
              <FadeUp delay={0.05}>
                {personality ? (
                  <Card className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full ${personality.bgColor} flex items-center justify-center shrink-0`}>
                      <span className="text-2xl">{personality.emoji}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${personality.color}`}>
                          {personality.label}
                        </span>
                        <Badge variant="teal" className="text-[10px]">
                          <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                          Insight
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {personality.description}
                      </p>
                    </div>
                  </Card>
                ) : (
                  <Card className="flex items-center gap-4 opacity-60">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Sparkles className="h-6 w-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Focus Personality</p>
                      <p className="text-xs text-slate-400">Complete more sessions to unlock your insight</p>
                    </div>
                  </Card>
                )}
              </FadeUp>
            </div>

            {/* ---- Summary stat cards ---- */}
            <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat) => (
                <StaggerItem key={stat.label}>
                  <Card className="flex items-center gap-4">
                    <div className={`${stat.bg} h-11 w-11 rounded-full flex items-center justify-center shrink-0`}>
                      {stat.icon}
                    </div>
                    <div>
                      <CountUp
                        value={stat.value}
                        decimals={stat.decimals}
                        suffix={stat.suffix}
                        className="text-2xl font-bold text-slate-900"
                      />
                      <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerList>

            {/* ---- Daily study bar chart ---- */}
            <FadeUp delay={0.15}>
              <Card>
                <CardTitle className="mb-5">Daily Study Time</CardTitle>
                <div className="flex items-end gap-1 h-[152px]">
                  {dailyData.map((day, i) => (
                    <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full min-w-0 group">
                      {day.minutes > 0 && (
                        <span className="text-[10px] text-slate-400 mb-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.minutes}m
                        </span>
                      )}
                      <motion.div
                        className="w-full max-w-[32px] rounded-t-md mx-auto cursor-default"
                        initial={{ height: 0 }}
                        animate={{
                          height: day.minutes > 0 ? Math.max(4, (day.minutes / maxMinutes) * 120) : 2,
                        }}
                        transition={{ duration: 0.5, delay: i * 0.025, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ scaleX: 1.15 }}
                        style={{
                          backgroundColor: day.minutes === 0 ? "#e2e8f0" : "#06b6d4",
                        }}
                      />
                      <span className="text-[10px] text-slate-400 mt-1 truncate w-full text-center">
                        {range === "7" ? day.dayLabel : day.dateLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </FadeUp>

            {/* ---- Study Intensity Heatmap ---- */}
            <FadeUp delay={0.18}>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="!mb-0">Study Intensity</CardTitle>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Less</span>
                    {HEATMAP_LEVELS.map((cls, i) => (
                      <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
                    ))}
                    <span className="text-[10px] text-slate-400">More</span>
                  </div>
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {heatmapData.weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                      {/* Pad first week to align days of week */}
                      {wi === 0 && Array.from({ length: week[0]?.dayOfWeek || 0 }).map((_, pi) => (
                        <div key={`pad-${pi}`} className="w-3 h-3" />
                      ))}
                      {week.map((day) => {
                        const level = getHeatmapLevel(day.minutes, heatmapData.maxMinutes);
                        return (
                          <motion.div
                            key={day.date}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: wi * 0.02 }}
                            className={`w-3 h-3 rounded-sm ${HEATMAP_LEVELS[level]} cursor-default`}
                            title={`${day.date}: ${day.minutes}m`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-3">
                  <span className="text-[10px] text-slate-400">Mon</span>
                  <span className="text-[10px] text-slate-400">Wed</span>
                  <span className="text-[10px] text-slate-400">Fri</span>
                  <span className="text-[10px] text-slate-400">Sun</span>
                </div>
              </Card>
            </FadeUp>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* ---- Subject breakdown ---- */}
              <FadeUp delay={0.2}>
                <Card>
                  <CardTitle className="mb-5">By Subject</CardTitle>
                  <div className="space-y-3">
                    {subjectData.map((item, i) => (
                      <div key={item.subject}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-700 font-medium truncate mr-2">{item.subject}</span>
                          <span className="text-slate-400 shrink-0">
                            {item.percent}% &middot; {formatDuration(item.seconds)}
                          </span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${SUBJECT_COLORS[i % SUBJECT_COLORS.length]}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percent}%` }}
                            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </FadeUp>

              {/* ---- Mode breakdown ---- */}
              <FadeUp delay={0.25}>
                <Card>
                  <CardTitle className="mb-5">By Mode</CardTitle>
                  <div className="space-y-4">
                    {modeData.map((item, i) => (
                      <div key={item.mode}>
                        <div className="flex justify-between text-sm mb-1">
                          <Badge variant={modeBadgeVariant(item.mode)}>
                            {modeLabel(item.mode)}
                          </Badge>
                          <span className="text-slate-400">
                            {item.count} sessions &middot; {formatDuration(item.totalSeconds)}
                          </span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              item.mode === "pomodoro" ? "bg-rose-500"
                              : item.mode === "deep_focus" ? "bg-cyan-500"
                              : "bg-amber-500"
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round((item.totalSeconds / maxModeSeconds) * 100)}%` }}
                            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </FadeUp>
            </div>

            {/* ---- Recent sessions ---- */}
            <FadeUp delay={0.3}>
              <Card>
                <CardTitle className="mb-5">Recent Sessions</CardTitle>
                <div className="divide-y divide-slate-100">
                  {recentSessions.map((session, i) => {
                    const date = new Date(session.completedAt);
                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="text-sm text-slate-400 w-24 shrink-0">
                            {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                          <Badge variant={modeBadgeVariant(session.mode)}>
                            {modeLabel(session.mode)}
                          </Badge>
                          {session.subject && (
                            <span className="text-sm text-slate-600 truncate">{session.subject}</span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-slate-700 shrink-0 ml-3">
                          {formatDuration(session.duration)}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </Card>
            </FadeUp>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
