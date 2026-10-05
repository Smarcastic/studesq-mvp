"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FadeUp, CountUp } from "@/components/ui/motion";
import {
  Timer,
  ListChecks,
  Layers,
  Zap,
  Flame,
  Play,
  Trophy,
} from "lucide-react";
import Link from "next/link";

interface WeeklyWinsProps {
  studyMinutes: number;
  assignmentsDone: number;
  flashcardReviews: number;
  xpEarned: number;
  streak: number;
}

interface WinStat {
  label: string;
  value: number;
  suffix: string;
  icon: React.ReactNode;
  color: string;
}

export function WeeklyWins({
  studyMinutes,
  assignmentsDone,
  flashcardReviews,
  xpEarned,
  streak,
}: WeeklyWinsProps) {
  const stats: WinStat[] = [
    {
      label: "Study Time",
      value: studyMinutes > 60 ? Math.round(studyMinutes / 60) : studyMinutes,
      suffix: studyMinutes > 60 ? "h" : "m",
      icon: <Timer className="h-4 w-4" />,
      color: "text-cyan-500",
    },
    {
      label: "Completed",
      value: assignmentsDone,
      suffix: " tasks",
      icon: <ListChecks className="h-4 w-4" />,
      color: "text-emerald-500",
    },
    {
      label: "Reviews",
      value: flashcardReviews,
      suffix: " decks",
      icon: <Layers className="h-4 w-4" />,
      color: "text-purple-500",
    },
    {
      label: "XP Earned",
      value: xpEarned,
      suffix: "",
      icon: <Zap className="h-4 w-4" />,
      color: "text-amber-500",
    },
    {
      label: "Streak",
      value: streak,
      suffix: " days",
      icon: <Flame className="h-4 w-4" />,
      color: "text-orange-500",
    },
  ];

  const activeStats = stats.filter((s) => s.value > 0);
  const isProductiveWeek = activeStats.length >= 3;

  return (
    <FadeUp delay={0.25}>
      <Card
        className={
          isProductiveWeek
            ? "bg-gradient-to-br from-emerald-50/50 via-white to-cyan-50/30 border-emerald-100"
            : ""
        }
      >
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            This Week&apos;s Wins
          </CardTitle>
          {isProductiveWeek && (
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Great week!
            </span>
          )}
        </div>

        {activeStats.length === 0 ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No wins yet this week — let&apos;s change that!</p>
            <Link href="/study/timer">
              <Button size="sm" variant="outline">
                <Play className="h-3.5 w-3.5" /> Start Studying
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`flex flex-col items-center p-3 rounded-xl ${
                  stat.value > 0 ? "" : "opacity-40"
                }`}
                style={{ background: 'var(--bg-elevated)' }}
              >
                <div className={stat.color}>{stat.icon}</div>
                <div className="text-lg font-bold mt-1 tabular" style={{ color: 'var(--text-primary)' }}>
                  {stat.value > 0 ? (
                    <CountUp value={stat.value} duration={1} />
                  ) : (
                    "0"
                  )}
                  <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{stat.suffix}</span>
                </div>
                <p className="text-[10px] uppercase tracking-wider font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </FadeUp>
  );
}
