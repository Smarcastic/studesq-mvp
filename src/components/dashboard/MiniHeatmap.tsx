"use client";

import { useMemo, useCallback } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { FadeUp } from "@/components/ui/motion";
import { BarChart3 } from "lucide-react";
import Link from "next/link";

interface HeatmapSession {
  completedAt: string;
  duration: number;
}

interface MiniHeatmapProps {
  sessions: HeatmapSession[];
}

const HEATMAP_LEVELS = [
  "bg-slate-100 dark:bg-slate-800",
  "bg-cyan-100",
  "bg-cyan-200",
  "bg-cyan-400",
  "bg-cyan-600",
];

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function MiniHeatmap({ sessions }: MiniHeatmapProps) {
  const heatmapData = useMemo(() => {
    const days = 91;
    const dayMap = new Map<string, number>();

    for (let i = days - 1; i >= 0; i--) {
      dayMap.set(dateKey(daysAgo(i)), 0);
    }

    for (const s of sessions) {
      const key = dateKey(new Date(s.completedAt));
      if (dayMap.has(key)) {
        dayMap.set(key, (dayMap.get(key) || 0) + s.duration);
      }
    }

    const entries = Array.from(dayMap.entries()).map(([ds, sec]) => ({
      date: ds,
      minutes: Math.round(sec / 60),
      dayOfWeek: new Date(ds + "T00:00:00").getDay(),
    }));

    // Group by weeks
    const weeks: typeof entries[] = [];
    let currentWeek: typeof entries = [];
    for (const e of entries) {
      if (e.dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(e);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    const maxMin = Math.max(1, ...entries.map((e) => e.minutes));
    return { weeks, maxMinutes: maxMin };
  }, [sessions]);

  const getLevel = useCallback((minutes: number, max: number) => {
    if (minutes === 0) return 0;
    const ratio = minutes / max;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  }, []);

  const totalDays = heatmapData.weeks.reduce((a, w) => a + w.filter((d) => d.minutes > 0).length, 0);

  return (
    <FadeUp delay={0.3}>
      <Link href="/study/analytics" className="block">
        <Card className="hover:border-cyan-200 transition-colors cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-500" />
              Study Activity
              <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                {totalDays} active days in 90
              </span>
            </CardTitle>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Last 90 days</span>
          </div>

          {/* Heatmap grid */}
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-[3px] min-w-fit">
              {heatmapData.weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      className={`w-[10px] h-[10px] rounded-[2px] ${
                        HEATMAP_LEVELS[getLevel(day.minutes, heatmapData.maxMinutes)]
                      }`}
                      title={`${day.date}: ${day.minutes}m`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1 mt-2">
            <span className="text-[10px] mr-1" style={{ color: 'var(--text-muted)' }}>Less</span>
            {HEATMAP_LEVELS.map((cls, i) => (
              <div key={i} className={`w-[10px] h-[10px] rounded-[2px] ${cls}`} />
            ))}
            <span className="text-[10px] ml-1" style={{ color: 'var(--text-muted)' }}>More</span>
          </div>
        </Card>
      </Link>
    </FadeUp>
  );
}
