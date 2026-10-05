"use client";

import { useMemo } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { FadeUp, CountUp } from "@/components/ui/motion";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Calendar, BarChart3 } from "lucide-react";

interface HabitLog {
  id: string;
  date: string;
  done: boolean;
}

interface Habit {
  id: string;
  title: string;
  emoji?: string;
  logs: HabitLog[];
  createdAt: string;
}

interface HabitInsightsProps {
  habits: Habit[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function HabitInsights({ habits }: HabitInsightsProps) {
  const insights = useMemo(() => {
    if (habits.length === 0) return null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Overall 30-day consistency
    let totalPossible = 0;
    let totalDone = 0;

    // Day-of-week stats
    const dayStats = Array.from({ length: 7 }, () => ({ done: 0, total: 0 }));

    // Per-habit stats
    const habitStats = habits.map((habit) => {
      const recentLogs = habit.logs.filter(
        (l) => new Date(l.date) >= thirtyDaysAgo
      );

      let done = 0;
      let total = recentLogs.length;

      for (const log of recentLogs) {
        if (log.done) done++;
        const dow = new Date(log.date).getDay();
        dayStats[dow].total++;
        if (log.done) dayStats[dow].done++;
      }

      totalPossible += total;
      totalDone += done;

      // Weekday vs weekend
      const weekdayLogs = recentLogs.filter((l) => {
        const d = new Date(l.date).getDay();
        return d >= 1 && d <= 5;
      });
      const weekendLogs = recentLogs.filter((l) => {
        const d = new Date(l.date).getDay();
        return d === 0 || d === 6;
      });

      const weekdayDone = weekdayLogs.filter((l) => l.done).length;
      const weekendDone = weekendLogs.filter((l) => l.done).length;
      const weekdayRate = weekdayLogs.length > 0 ? Math.round((weekdayDone / weekdayLogs.length) * 100) : 0;
      const weekendRate = weekendLogs.length > 0 ? Math.round((weekendDone / weekendLogs.length) * 100) : 0;

      return {
        title: habit.title,
        emoji: habit.emoji || "✅",
        rate: total > 0 ? Math.round((done / total) * 100) : 0,
        weekdayRate,
        weekendRate,
      };
    });

    // Find best day
    let bestDayIdx = 0;
    let bestDayRate = 0;
    for (let i = 0; i < 7; i++) {
      const rate = dayStats[i].total > 0 ? dayStats[i].done / dayStats[i].total : 0;
      if (rate > bestDayRate) {
        bestDayRate = rate;
        bestDayIdx = i;
      }
    }

    const overallConsistency = totalPossible > 0
      ? Math.round((totalDone / totalPossible) * 100)
      : 0;

    // 30-day mini calendar
    const calendarDays: { date: string; level: "full" | "partial" | "none" }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);

      let doneCount = 0;
      let totalCount = 0;
      for (const habit of habits) {
        const log = habit.logs.find((l) => l.date === dateStr);
        if (log) {
          totalCount++;
          if (log.done) doneCount++;
        }
      }

      calendarDays.push({
        date: dateStr,
        level:
          totalCount === 0 ? "none" :
          doneCount === totalCount ? "full" :
          doneCount > 0 ? "partial" : "none",
      });
    }

    return {
      overallConsistency,
      bestDay: DAY_LABELS[bestDayIdx],
      bestDayRate: Math.round(bestDayRate * 100),
      dayStats,
      habitStats,
      calendarDays,
    };
  }, [habits]);

  if (!insights) return null;

  return (
    <FadeUp delay={0.1}>
      <Card className="mt-6">
        <CardTitle className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-cyan-500" />
          Habit Insights
          <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>Last 30 days</span>
        </CardTitle>

        {/* Overview stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {/* Overall consistency */}
          <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
            <p className="text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Consistency
            </p>
            <div className="text-2xl font-bold text-cyan-500 tabular">
              <CountUp value={insights.overallConsistency} duration={1} />%
            </div>
            <Progress value={insights.overallConsistency} className="mt-2" />
          </div>

          {/* Best day */}
          <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
            <p className="text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Strongest Day
            </p>
            <div className="text-2xl font-bold text-indigo-500">{insights.bestDay}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{insights.bestDayRate}% completion</p>
          </div>

          {/* 30-day mini calendar */}
          <div className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
            <p className="text-xs uppercase tracking-wider font-medium mb-2 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <Calendar className="h-3 w-3" />
              30 Days
            </p>
            <div className="flex flex-wrap gap-1">
              {insights.calendarDays.map((day) => (
                <div
                  key={day.date}
                  className={`w-[12px] h-[12px] rounded-sm ${
                    day.level === "full"
                      ? "bg-emerald-400"
                      : day.level === "partial"
                      ? "bg-amber-300"
                      : "bg-slate-200 dark:bg-slate-700"
                  }`}
                  title={day.date}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-emerald-400" />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>All</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-amber-300" />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Partial</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-slate-200" />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>None</span>
              </div>
            </div>
          </div>
        </div>

        {/* Day-of-week breakdown */}
        <div className="mb-5">
          <p className="text-xs font-medium mb-2 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
            <BarChart3 className="h-3 w-3" />
            Completion by Day
          </p>
          <div className="flex gap-2">
            {DAY_LABELS.map((day, i) => {
              const stat = insights.dayStats[i];
              const rate = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
              return (
                <div key={day} className="flex-1 text-center">
                  <div className="h-16 flex items-end justify-center mb-1">
                    <div
                      className="w-full max-w-[24px] rounded-t-sm bg-cyan-400 transition-all"
                      style={{ height: `${Math.max(rate, 4)}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{day}</p>
                  <p className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{rate}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-habit insights */}
        {insights.habitStats.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Per Habit</p>
            <div className="space-y-2">
              {insights.habitStats.map((h) => (
                <div key={h.title} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                  <span className="text-sm">{h.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{h.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {h.weekdayRate}% weekdays · {h.weekendRate}% weekends
                    </p>
                  </div>
                  <span className={`text-sm font-semibold tabular ${
                    h.rate >= 80 ? "text-emerald-500" :
                    h.rate >= 50 ? "text-amber-500" : "text-slate-400 dark:text-slate-500"
                  }`}>
                    {h.rate}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </FadeUp>
  );
}
