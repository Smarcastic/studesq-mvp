"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeUp, StaggerList, StaggerItem } from "@/components/ui/motion";
import { formatDate } from "@/lib/utils";
import {
  ListChecks,
  CalendarClock,
  Layers,
  Play,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface TodayFocusProps {
  assignments: {
    id: string;
    title: string;
    subject?: string | null;
    dueDate?: string | null;
    priority: string;
  }[];
  exams: {
    id: string;
    subject: string;
    date: string;
    color?: string | null;
  }[];
  dueFlashcards: number;
  todayStudyMinutes: number;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-blue-500",
  low: "bg-slate-400",
};

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function countdownLabel(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

export function TodayFocus({ assignments, exams, dueFlashcards, todayStudyMinutes }: TodayFocusProps) {
  const hasItems = assignments.length > 0 || exams.length > 0 || dueFlashcards > 0;

  if (!hasItems) {
    return (
      <FadeUp delay={0.07}>
        <Card className="border-l-4 border-l-emerald-400">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 shrink-0">
              <Sparkles className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>All caught up — great planning!</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {todayStudyMinutes > 0
                  ? `You've studied ${todayStudyMinutes}m today. Keep it up!`
                  : "Start a study session to build your streak."}
              </p>
            </div>
            <Link href="/study/timer">
              <Button size="sm" variant="outline">
                <Play className="h-3.5 w-3.5" /> Study
              </Button>
            </Link>
          </div>
        </Card>
      </FadeUp>
    );
  }

  return (
    <FadeUp delay={0.07}>
      <Card className="border-l-4 border-l-cyan-400">
        <CardTitle className="mb-3 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-cyan-500" />
          Today&apos;s Focus
        </CardTitle>

        <StaggerList className="space-y-2">
          {/* Assignments due today/tomorrow */}
          {assignments.map((a) => (
            <StaggerItem key={a.id}>
              <Link href="/assignments">
                <div className="flex items-center gap-3 p-2.5 rounded-xl transition-colors" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                    <ListChecks className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {a.subject && `${a.subject} · `}
                      {a.dueDate ? countdownLabel(a.dueDate) : "No date"}
                    </p>
                  </div>
                  <div className={`h-2 w-2 rounded-full shrink-0 ${PRIORITY_COLORS[a.priority] || PRIORITY_COLORS.medium}`} />
                </div>
              </Link>
            </StaggerItem>
          ))}

          {/* Upcoming exams */}
          {exams.map((e) => (
            <StaggerItem key={e.id}>
              <Link href="/exams">
                <div className="flex items-center gap-3 p-2.5 rounded-xl transition-colors" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10">
                    <CalendarClock className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{e.subject}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(e.date)}</p>
                  </div>
                  <Badge variant={daysUntil(e.date) <= 2 ? "error" : "warning"}>
                    {countdownLabel(e.date)}
                  </Badge>
                </div>
              </Link>
            </StaggerItem>
          ))}

          {/* Flashcards due */}
          {dueFlashcards > 0 && (
            <StaggerItem>
              <Link href="/study/flashcards">
                <div className="flex items-center gap-3 p-2.5 rounded-xl transition-colors" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-500/10">
                    <Layers className="h-3.5 w-3.5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Flashcard Reviews Due</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Cards ready for spaced repetition review</p>
                  </div>
                  <Badge variant="teal">{dueFlashcards} cards</Badge>
                </div>
              </Link>
            </StaggerItem>
          )}
        </StaggerList>
      </Card>
    </FadeUp>
  );
}
