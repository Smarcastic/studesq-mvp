"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { FadeUp, StaggerList, StaggerItem, CountUp } from "@/components/ui/motion";
import { formatDate, formatHours } from "@/lib/utils";
import { categoryLabels } from "@/lib/validations/achievement";
import { getLevelForXP, getLevelProgress, getNextLevel, xpToNextLevel, formatXP } from "@/lib/xp-system";
import { TodayFocus } from "@/components/dashboard/TodayFocus";
import { BadgeShelf } from "@/components/dashboard/BadgeShelf";
import { WeeklyWins } from "@/components/dashboard/WeeklyWins";
import { MiniHeatmap } from "@/components/dashboard/MiniHeatmap";
import { SmartInsights } from "@/components/dashboard/SmartInsights";
import type { BadgeStats } from "@/lib/badges";
import type { StudentAnalyticsData } from "@/lib/ai-engine";
import {
  Trophy,
  Timer,
  ListChecks,
  Plus,
  Play,
  StickyNote,
  Target,
  Layers,
  Flame,
  Clock,
  Zap,
  Star,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  Store,
  ArrowRight,
  UserCircle,
} from "lucide-react";
import Link from "next/link";

const MOOD_EMOJI: Record<string, { emoji: string; label: string }> = {
  great: { emoji: "😄", label: "Feeling great" },
  good: { emoji: "🙂", label: "Feeling good" },
  okay: { emoji: "😐", label: "Feeling okay" },
  low: { emoji: "😔", label: "Feeling low" },
  stressed: { emoji: "😰", label: "Feeling stressed" },
};

interface DashboardData {
  stats: {
    achievements: number;
    studyMinutes: number;
    activeAssignments: number;
    streak: number;
    gpa: number | null;
    activeGoals: number;
    todayStudyMinutes: number;
  };
  upcomingAssignments: {
    id: string;
    title: string;
    subject?: string;
    dueDate?: string;
    priority: string;
  }[];
  recentAchievements: {
    id: string;
    title: string;
    category: string;
    date: string;
  }[];
  recentNotes: {
    id: string;
    title: string;
    updatedAt: string;
  }[];
  latestMood: {
    mood: string;
    date: string;
  } | null;
  todayFocus: {
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
  };
  badgeStats: BadgeStats;
  weeklyWins: {
    studyMinutes: number;
    assignmentsDone: number;
    flashcardReviews: number;
    xpEarned: number;
    streak: number;
  };
  heatmapSessions: {
    completedAt: string;
    duration: number;
  }[];
  insightsData: StudentAnalyticsData;
}

interface XPData {
  xp: number;
  level: string;
  levelInfo: {
    name: string;
    icon: string;
    description: string;
    color: string;
    bgColor: string;
  };
  recentEvents: {
    id: string;
    action: string;
    xp: number;
    createdAt: string;
  }[];
}

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); }),
  });

  const { data: xpData } = useQuery<XPData>({
    queryKey: ["xp"],
    queryFn: () => fetch("/api/xp").then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); }),
  });

  const greeting = getGreeting();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  const levelInfo = xpData ? getLevelForXP(xpData.xp) : null;
  const levelProgress = xpData ? getLevelProgress(xpData.xp) : 0;
  const nextLevel = xpData ? getNextLevel(xpData.xp) : null;
  const xpNeeded = xpData ? xpToNextLevel(xpData.xp) : 0;

  const moodInfo = data?.latestMood ? MOOD_EMOJI[data.latestMood.mood] : null;
  const streakAtRisk = data?.stats?.streak && data.stats.streak > 0 && data.stats.todayStudyMinutes === 0;

  return (
    <div className="space-y-6">
      {/* Welcome + XP Banner */}
      <FadeUp>
        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500 via-teal-500 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="absolute inset-0 opacity-15">
            <div className="absolute w-80 h-80 -top-40 -right-40 bg-white rounded-full blur-3xl" />
            <div className="absolute w-48 h-48 -bottom-24 -left-24 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">
                  {greeting}, {firstName}
                </h1>
                <p className="text-white/70 mt-1">
                  {isLoading
                    ? "Loading your progress..."
                    : data?.stats?.todayStudyMinutes && data.stats.todayStudyMinutes > 0
                    ? `${data.stats.todayStudyMinutes}m studied today · ${formatHours(data.stats.studyMinutes)} this week`
                    : `${formatHours(data?.stats?.studyMinutes || 0)} studied this week`}
                </p>
                {moodInfo && (
                  <p className="text-white/60 text-sm mt-1">
                    {moodInfo.emoji} {moodInfo.label}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Link href="/study/timer">
                  <Button size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm">
                    <Play className="h-4 w-4" /> Start Timer
                  </Button>
                </Link>
              </div>
            </div>

            {/* XP Level Bar */}
            {levelInfo && (
              <div className="mt-5 pt-4 border-t border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{levelInfo.icon}</span>
                    <span className="font-semibold text-sm">{levelInfo.name}</span>
                    <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      {formatXP(xpData?.xp || 0)} XP
                    </span>
                  </div>
                  {nextLevel && (
                    <span className="text-xs text-white/60">
                      {xpNeeded} XP to {nextLevel.name}
                    </span>
                  )}
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-white/80"
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </FadeUp>

      {/* Welcome Checklist — shown until user has completed core setup */}
      {!isLoading && data && (
        <WelcomeChecklist
          hasStudied={(data.stats?.studyMinutes ?? 0) > 0}
          hasAchievements={(data.stats?.achievements ?? 0) > 0}
          hasGoals={(data.stats?.activeGoals ?? 0) > 0}
          hasAssignments={(data.stats?.activeAssignments ?? 0) > 0}
          hasNotes={(data.recentNotes?.length ?? 0) > 0}
          hasSavedEvent={false}
        />
      )}

      {/* Streak Warning */}
      {streakAtRisk && (
        <FadeUp delay={0.05}>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                Your {data?.stats?.streak}-day streak is at risk!
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Complete a study session today to keep it going.
              </p>
            </div>
            <Link href="/study/timer">
              <Button size="sm" variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-100">
                <Play className="h-3.5 w-3.5" /> Study Now
              </Button>
            </Link>
          </div>
        </FadeUp>
      )}

      {/* Today's Focus */}
      {!isLoading && data?.todayFocus && (
        <TodayFocus
          assignments={data.todayFocus.assignments}
          exams={data.todayFocus.exams}
          dueFlashcards={data.todayFocus.dueFlashcards}
          todayStudyMinutes={data?.stats?.todayStudyMinutes || 0}
        />
      )}

      {/* Stats Grid */}
      <FadeUp delay={0.1}>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Study Time"
            icon={<Timer className="h-5 w-5 text-cyan-500" />}
            isLoading={isLoading}
            displayValue={isLoading ? 0 : data?.stats?.studyMinutes && data.stats.studyMinutes > 60 ? Math.round(data.stats.studyMinutes / 60) : data?.stats?.studyMinutes || 0}
            suffix={data?.stats?.studyMinutes && data.stats.studyMinutes > 60 ? "h" : "m"}
          />
          <StatCard
            label="Streak"
            icon={<Flame className="h-5 w-5 text-orange-500" />}
            isLoading={isLoading}
            displayValue={data?.stats?.streak || 0}
            suffix=" days"
          />
          <StatCard
            label="Achievements"
            icon={<Trophy className="h-5 w-5 text-amber-500" />}
            isLoading={isLoading}
            displayValue={data?.stats?.achievements || 0}
            suffix=""
          />
          <StatCard
            label="Active Goals"
            icon={<Target className="h-5 w-5 text-indigo-500" />}
            isLoading={isLoading}
            displayValue={data?.stats?.activeGoals || 0}
            suffix=""
          />
          {data?.stats?.gpa !== null && data?.stats?.gpa !== undefined ? (
            <StatCard
              label="GPA"
              icon={<Star className="h-5 w-5 text-emerald-500" />}
              isLoading={isLoading}
              displayValue={data.stats.gpa}
              suffix=""
              decimals={2}
            />
          ) : (
            <StatCard
              label="Deadlines"
              icon={<Clock className="h-5 w-5 text-red-500" />}
              isLoading={isLoading}
              displayValue={data?.stats?.activeAssignments || 0}
              suffix=" due"
            />
          )}
        </div>
      </FadeUp>

      {/* Recommended Events — Marketplace */}
      <FadeUp delay={0.15}>
        <RecommendedEventsWidget />
      </FadeUp>

      {/* Badge Shelf */}
      {!isLoading && data?.badgeStats && (
        <BadgeShelf stats={data.badgeStats} />
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Achievements */}
        <FadeUp delay={0.2}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Recent Achievements</CardTitle>
              <Link href="/achievements">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </div>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : data?.recentAchievements?.length ? (
                <StaggerList className="space-y-2">
                  {data.recentAchievements.map((a) => (
                    <StaggerItem key={a.id}>
                      <div className="flex items-center gap-3 p-3 rounded-xl transition-colors" style={{ background: 'var(--bg-elevated)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}>
                        <div className="p-2 rounded-lg bg-amber-50">
                          <Trophy className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {a.title}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {formatDate(a.date)}
                          </p>
                        </div>
                        <Badge variant="teal">
                          {categoryLabels[a.category] || a.category}
                        </Badge>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerList>
              ) : (
                <DashboardEmpty
                  icon={<Trophy className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />}
                  message="No achievements yet — add your first one!"
                  href="/achievements"
                />
              )}
            </CardContent>
          </Card>
        </FadeUp>

        {/* Upcoming Assignments */}
        <FadeUp delay={0.25}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Upcoming Assignments</CardTitle>
              <Link href="/assignments">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </div>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : data?.upcomingAssignments?.length ? (
                <StaggerList className="space-y-2">
                  {data.upcomingAssignments.map((a) => (
                    <StaggerItem key={a.id}>
                      <div className="flex items-center gap-3 p-3 rounded-xl transition-colors" style={{ background: 'var(--bg-elevated)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}>
                        <div className="p-2 rounded-lg bg-blue-50">
                          <ListChecks className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {a.title}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {a.subject && `${a.subject} · `}
                            {a.dueDate
                              ? `Due ${formatDate(a.dueDate)}`
                              : "No due date"}
                          </p>
                        </div>
                        <PriorityDot priority={a.priority} />
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerList>
              ) : (
                <DashboardEmpty
                  icon={<ListChecks className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />}
                  message="No upcoming assignments."
                  href="/assignments"
                />
              )}
            </CardContent>
          </Card>
        </FadeUp>
      </div>

      {/* XP Activity + Recent Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* XP Activity */}
        <FadeUp delay={0.3}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Recent XP Activity</CardTitle>
              {xpData && (
                <Badge variant="teal">
                  <Zap className="h-3 w-3 mr-1" />
                  {formatXP(xpData.xp)} XP Total
                </Badge>
              )}
            </div>
            <CardContent>
              {xpData?.recentEvents?.length ? (
                <StaggerList className="space-y-2">
                  {xpData.recentEvents.slice(0, 5).map((e) => (
                    <StaggerItem key={e.id}>
                      <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-cyan-50">
                            <Zap className="h-4 w-4 text-cyan-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {formatAction(e.action)}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {formatDate(e.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-cyan-600">
                          +{e.xp} XP
                        </span>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerList>
              ) : (
                <DashboardEmpty
                  icon={<Zap className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />}
                  message="No XP earned yet — start studying!"
                  href="/study/timer"
                />
              )}
            </CardContent>
          </Card>
        </FadeUp>

        {/* Recent Notes */}
        <FadeUp delay={0.35}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Recent Notes</CardTitle>
              <Link href="/study/notes">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </div>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : data?.recentNotes?.length ? (
                <StaggerList className="space-y-2">
                  {data.recentNotes.map((n) => (
                    <StaggerItem key={n.id}>
                      <Link href={`/study/notes/${n.id}`}>
                        <div className="flex items-center gap-3 p-3 rounded-xl transition-colors" style={{ background: 'var(--bg-elevated)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}>
                          <div className="p-2 rounded-lg bg-indigo-50">
                            <StickyNote className="h-4 w-4 text-indigo-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                              {n.title || "Untitled Note"}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {formatDate(n.updatedAt)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </StaggerItem>
                  ))}
                </StaggerList>
              ) : (
                <DashboardEmpty
                  icon={<StickyNote className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />}
                  message="No notes yet — start writing!"
                  href="/study/notes"
                />
              )}
            </CardContent>
          </Card>
        </FadeUp>
      </div>

      {/* Weekly Wins */}
      {!isLoading && data?.weeklyWins && (
        <WeeklyWins
          studyMinutes={data.weeklyWins.studyMinutes}
          assignmentsDone={data.weeklyWins.assignmentsDone}
          flashcardReviews={data.weeklyWins.flashcardReviews}
          xpEarned={data.weeklyWins.xpEarned}
          streak={data.weeklyWins.streak}
        />
      )}

      {/* Study Heatmap + Smart Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mini Heatmap */}
        {!isLoading && data?.heatmapSessions && (
          <MiniHeatmap sessions={data.heatmapSessions} />
        )}

        {/* Smart Insights */}
        {!isLoading && data?.insightsData && (
          <SmartInsights data={data.insightsData} />
        )}
      </div>

      {/* Quick Actions */}
      <FadeUp delay={0.4}>
        <Card>
          <CardTitle>Quick Actions</CardTitle>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
              <QuickAction href="/marketplace" icon={<Store className="h-5 w-5" />} label="Explore Events" color="text-cyan-500" />
              <QuickAction href="/achievements" icon={<Plus className="h-5 w-5" />} label="Add Achievement" color="text-amber-500" />
              <QuickAction href="/study/timer" icon={<Timer className="h-5 w-5" />} label="Start Timer" color="text-indigo-500" />
              <QuickAction href="/study/flashcards" icon={<Layers className="h-5 w-5" />} label="Flashcards" color="text-purple-500" count={data?.todayFocus?.dueFlashcards} countLabel="due" />
              <QuickAction href="/assignments" icon={<ListChecks className="h-5 w-5" />} label="Assignments" color="text-emerald-500" count={data?.stats?.activeAssignments} countLabel="due" />
              <QuickAction href="/profile" icon={<UserCircle className="h-5 w-5" />} label="My Profile" color="text-rose-500" />
            </div>
          </CardContent>
        </Card>
      </FadeUp>
    </div>
  );
}

function StatCard({
  label,
  icon,
  isLoading,
  displayValue,
  suffix,
  decimals = 0,
}: {
  label: string;
  icon: React.ReactNode;
  isLoading: boolean;
  displayValue: number;
  suffix: string;
  decimals?: number;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>
            {label}
          </p>
          <div className="text-2xl font-bold tabular" style={{ color: 'var(--text-primary)' }}>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <>
                <CountUp value={displayValue} duration={1.2} decimals={decimals} />
                <span className="text-sm font-normal ml-0.5" style={{ color: 'var(--text-muted)' }}>
                  {suffix}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function QuickAction({
  href,
  icon,
  label,
  color,
  count,
  countLabel,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  count?: number;
  countLabel?: string;
}) {
  return (
    <Link
      href={href}
      className="relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 group"
      style={{ background: 'var(--bg-elevated)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-subtle)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
    >
      {count !== undefined && count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-cyan-500 text-white text-[10px] font-bold px-1.5">
          {count > 99 ? "99+" : count}
          {countLabel ? ` ${countLabel}` : ""}
        </span>
      )}
      <div className={`${color} transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <span className="text-xs font-medium text-center" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
    </Link>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    urgent: "bg-red-500",
    high: "bg-amber-500",
    medium: "bg-blue-500",
    low: "bg-slate-400",
  };
  return (
    <div className={`h-2.5 w-2.5 rounded-full ${colors[priority] || colors.medium}`} />
  );
}

function DashboardEmpty({
  icon,
  message,
  href,
}: {
  icon: React.ReactNode;
  message: string;
  href: string;
}) {
  return (
    <div className="flex flex-col items-center py-8 gap-3">
      {icon}
      <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>{message}</p>
      <Link href={href}>
        <Button variant="outline" size="sm">
          Get started
        </Button>
      </Link>
    </div>
  );
}

function formatAction(action: string): string {
  const labels: Record<string, string> = {
    study_session: "Study Session",
    deep_focus_session: "Deep Focus Session",
    achievement_added: "Achievement Logged",
    streak_day: "Streak Maintained",
    goal_completed: "Goal Completed",
    habit_completed: "Habit Completed",
    flashcard_review: "Flashcard Review",
    reading_finished: "Book Finished",
    first_session: "First Session",
    week_streak: "7-Day Streak",
    month_streak: "30-Day Streak",
  };
  return labels[action] || action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function WelcomeChecklist({
  hasStudied,
  hasAchievements,
  hasGoals,
  hasAssignments,
  hasNotes,
  hasSavedEvent,
}: {
  hasStudied: boolean;
  hasAchievements: boolean;
  hasGoals: boolean;
  hasAssignments: boolean;
  hasNotes: boolean;
  hasSavedEvent: boolean;
}) {
  const steps = [
    { done: hasAchievements, label: "Log your first achievement", href: "/achievements", icon: Trophy },
    { done: hasSavedEvent, label: "Save an event from the Marketplace", href: "/marketplace", icon: Store },
    { done: hasStudied, label: "Complete a study session", href: "/study/timer", icon: Timer },
    { done: hasAssignments, label: "Add an assignment or deadline", href: "/assignments", icon: ListChecks },
    { done: hasGoals, label: "Set a goal to work towards", href: "/goals", icon: Target },
  ];

  const completed = steps.filter((s) => s.done).length;
  const allDone = completed === steps.length;

  // Don't show if user has dismissed or completed all steps
  if (allDone) return null;

  // Don't show if user has already done most things (returning user)
  if (completed >= 4) return null;

  return (
    <FadeUp delay={0.05}>
      <Card className="border-cyan-100 bg-gradient-to-br from-cyan-50/50 to-transparent">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-cyan-100 shrink-0">
            <GraduationCap className="h-6 w-6 text-cyan-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Welcome to StudesQ!</h3>
            <p className="text-sm mt-0.5 mb-4" style={{ color: 'var(--text-muted)' }}>
              Start building your academic identity. {completed}/{steps.length} done.
            </p>

            <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: 'var(--bg-elevated)' }}>
              <motion.div
                className="h-full bg-cyan-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(completed / steps.length) * 100}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            <div className="space-y-2">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <Link
                    key={step.label}
                    href={step.href}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                      step.done
                        ? "bg-emerald-50/50"
                        : ""
                    }`}
                    style={!step.done ? { background: 'var(--bg-card)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-subtle)' } : undefined}
                    onMouseEnter={e => { if (!step.done) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                    onMouseLeave={e => { if (!step.done) e.currentTarget.style.background = 'var(--bg-card)'; }}
                  >
                    <div className={`p-1.5 rounded-lg ${step.done ? "bg-emerald-100" : ""}`} style={!step.done ? { background: 'var(--bg-elevated)' } : undefined}>
                      {step.done ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        >
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </motion.div>
                      ) : (
                        <Icon className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                    <span className={`text-sm ${step.done ? "line-through" : "font-medium"}`} style={{ color: step.done ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                      {step.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </FadeUp>
  );
}

function RecommendedEventsWidget() {
  const { data: events = [], isLoading } = useQuery<{
    id: string; slug: string; title: string; category: string;
    organizerName: string; city: string | null; state: string | null;
    isOnline: boolean; registrationDeadline: string | null; fee: number | null;
    isVerified: boolean; matchScore: number;
  }[]>({
    queryKey: ["marketplace-recommended"],
    queryFn: () => fetch("/api/marketplace/recommended").then(r => r.json()),
  });

  const CATEGORY_COLORS: Record<string, string> = {
    OLYMPIAD: "bg-amber-50 text-amber-700",
    MUN: "bg-indigo-50 text-indigo-700",
    HACKATHON: "bg-cyan-50 text-cyan-700",
    RESEARCH: "bg-emerald-50 text-emerald-700",
    SCHOLARSHIP: "bg-purple-50 text-purple-700",
    SPORTS: "bg-blue-50 text-blue-700",
    ARTS: "bg-rose-50 text-rose-700",
    QUIZ: "bg-orange-50 text-orange-700",
    INTERNSHIP: "bg-teal-50 text-teal-700",
    EXCHANGE: "bg-sky-50 text-sky-700",
    PROGRAM: "bg-violet-50 text-violet-700",
    OTHER: "bg-slate-50 text-slate-700",
  };

  function formatDeadline(deadline: string | null) {
    if (!deadline) return null;
    const d = new Date(deadline);
    const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return null;
    if (days === 0) return { label: "Closes today!", urgent: true };
    if (days <= 3) return { label: `${days}d left`, urgent: true };
    if (days <= 14) return { label: `${days} days left`, urgent: false };
    return { label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), urgent: false };
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
            <Store className="h-4 w-4 text-cyan-500" />
          </div>
          <CardTitle>Recommended for You</CardTitle>
        </div>
        <Link href="/marketplace">
          <Button variant="ghost" size="sm" className="gap-1">
            Browse all <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center py-6 gap-2">
            <Store className="h-8 w-8 opacity-20" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No events found. Update your grade in profile!</p>
            <Link href="/marketplace"><Button variant="outline" size="sm">Browse Marketplace</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {events.slice(0, 6).map(ev => {
              const deadline = formatDeadline(ev.registrationDeadline);
              const catColor = CATEGORY_COLORS[ev.category] ?? CATEGORY_COLORS.OTHER;
              return (
                <Link key={ev.id} href={`/marketplace/${ev.slug}`}>
                  <div
                    className="p-3 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catColor}`}>
                        {ev.category}
                      </span>
                      {ev.matchScore >= 70 && (
                        <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded-full">
                          {ev.matchScore}% match
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold leading-tight mb-1 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                      {ev.title}
                    </p>
                    <p className="text-[11px] truncate mb-2" style={{ color: 'var(--text-muted)' }}>
                      {ev.organizerName}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-medium ${ev.fee === null ? 'text-emerald-600' : ''}`} style={ev.fee !== null ? { color: 'var(--text-muted)' } : undefined}>
                        {ev.fee === null ? 'Free' : `₹${ev.fee.toLocaleString('en-IN')}`}
                      </span>
                      {deadline && (
                        <span className={`text-[10px] font-medium ${deadline.urgent ? 'text-red-500' : ''}`} style={!deadline.urgent ? { color: 'var(--text-muted)' } : undefined}>
                          {deadline.label}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
