"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/layout/page-header";
import { FadeUp, StaggerList, StaggerItem } from "@/components/ui/motion";
import { getLevelForXP } from "@/lib/xp-system";
import { Medal, Trophy, Crown, Shield, Star, Users, Globe } from "lucide-react";
import Link from "next/link";

type LeaderboardEntry = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  school: string | null;
  grade: string | null;
  level: string;
  xp: number;
  verifiedAchievementsCount: number;
  trustScore: number;
  rank: number;
  isCurrentUser: boolean;
};

type Category = "xp" | "achievements" | "trust";
type Scope = "global" | "school";

const CATEGORY_CONFIG = {
  xp: {
    label: "XP Leaders",
    icon: Star,
    getValue: (e: LeaderboardEntry) => e.xp,
    formatValue: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}K XP` : `${v} XP`,
    color: "text-cyan-600",
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
  },
  achievements: {
    label: "Most Achievements",
    icon: Trophy,
    getValue: (e: LeaderboardEntry) => e.verifiedAchievementsCount,
    formatValue: (v: number) => `${v} verified`,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  trust: {
    label: "Trust Score",
    icon: Shield,
    getValue: (e: LeaderboardEntry) => e.trustScore,
    formatValue: (v: number) => `${v} pts`,
    color: "text-indigo-600",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
  },
};

const PODIUM_MEDALS = [
  { rank: 1, icon: "🥇", bg: "bg-amber-50 dark:bg-amber-900/30", border: "border-amber-300", shadow: "shadow-amber-100", size: "h-20 w-20", nameSize: "text-base font-bold", podiumH: "h-24" },
  { rank: 2, icon: "🥈", bg: "bg-slate-50 dark:bg-slate-800/50", border: "border-slate-300", shadow: "shadow-slate-100", size: "h-16 w-16", nameSize: "text-sm font-semibold", podiumH: "h-16" },
  { rank: 3, icon: "🥉", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-300", shadow: "shadow-orange-100", size: "h-14 w-14", nameSize: "text-sm font-semibold", podiumH: "h-12" },
];

function PodiumCard({
  entry,
  category,
  position,
}: {
  entry: LeaderboardEntry;
  category: Category;
  position: typeof PODIUM_MEDALS[0];
}) {
  const config = CATEGORY_CONFIG[category];
  const value = config.getValue(entry);
  const levelInfo = getLevelForXP(entry.xp);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 ${position.bg} ${position.border} shadow-sm ${position.shadow} ${entry.isCurrentUser ? "ring-2 ring-primary-400" : ""}`}>
        <span className="text-2xl">{position.icon}</span>
        <Avatar src={entry.image} name={entry.name ?? "?"} size={position.rank === 1 ? "lg" : "md"} />
        <div className="text-center">
          <Link href={`/u/${entry.username}`}>
            <p className={`${position.nameSize} hover:underline`} style={{ color: "var(--text-primary)" }}>
              {entry.name ?? entry.username}
            </p>
          </Link>
          {entry.username && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>@{entry.username}</p>
          )}
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className="text-xs">{levelInfo.icon}</span>
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{levelInfo.name}</span>
          </div>
        </div>
        <Badge variant="secondary" className={`text-xs ${config.color}`}>
          {config.formatValue(value)}
        </Badge>
      </div>
      {/* Podium base */}
      <div
        className={`w-full ${position.podiumH} rounded-t-lg flex items-center justify-center font-bold text-lg`}
        style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
      >
        #{position.rank}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [category, setCategory] = useState<Category>("xp");
  const [scope, setScope] = useState<Scope>("global");

  const { data: entries, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard", category, scope],
    queryFn: () =>
      fetch(`/api/leaderboard?category=${category}&scope=${scope}`).then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      }),
    refetchInterval: 60_000, // refresh every minute
  });

  const config = CATEGORY_CONFIG[category];
  const top3 = entries?.filter((e) => e.rank <= 3) ?? [];
  const rest = entries?.filter((e) => e.rank > 3 && !e.isCurrentUser) ?? [];
  const myEntry = entries?.find((e) => e.isCurrentUser);
  const myEntryInRest = entries?.find((e) => e.isCurrentUser && e.rank > 3);

  // Arrange podium: 2nd | 1st | 3rd
  const podiumOrder = [
    top3.find((e) => e.rank === 2),
    top3.find((e) => e.rank === 1),
    top3.find((e) => e.rank === 3),
  ].filter(Boolean) as LeaderboardEntry[];

  return (
    <div>
      <PageHeader title="Leaderboard" />

      <FadeUp>
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {/* Category tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
              {(Object.keys(CATEGORY_CONFIG) as Category[]).map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const Icon = cfg.icon;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      category === cat
                        ? "bg-white dark:bg-slate-700 shadow-sm"
                        : ""
                    }`}
                    style={{
                      color: category === cat ? "var(--text-primary)" : "var(--text-muted)",
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{cfg.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scope toggle */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
              <button
                onClick={() => setScope("global")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  scope === "global" ? "bg-white dark:bg-slate-700 shadow-sm" : ""
                }`}
                style={{ color: scope === "global" ? "var(--text-primary)" : "var(--text-muted)" }}
              >
                <Globe className="h-3.5 w-3.5" />
                Global
              </button>
              <button
                onClick={() => setScope("school")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  scope === "school" ? "bg-white dark:bg-slate-700 shadow-sm" : ""
                }`}
                style={{ color: scope === "school" ? "var(--text-primary)" : "var(--text-muted)" }}
              >
                <Users className="h-3.5 w-3.5" />
                My School
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 h-48">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="rounded-2xl" />
                ))}
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : !entries?.length ? (
            <Card>
              <CardContent className="py-16 flex flex-col items-center gap-3">
                <Medal className="h-12 w-12" style={{ color: "var(--text-muted)" }} />
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                  No students found
                </p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {scope === "school"
                    ? "No other students from your school yet. Invite classmates!"
                    : "Be the first to earn XP and top the leaderboard!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Podium — top 3 */}
              {podiumOrder.length > 0 && (
                <Card>
                  <CardContent className="pt-6 pb-0 overflow-hidden">
                    <div className="flex items-end justify-center gap-3 sm:gap-6">
                      {podiumOrder.map((entry) => {
                        const position = PODIUM_MEDALS.find((p) => p.rank === entry.rank)!;
                        return (
                          <div key={entry.id} className="flex-1 max-w-[160px]">
                            <PodiumCard entry={entry} category={category} position={position} />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ranked list (4-50) */}
              {rest.length > 0 && (
                <Card>
                  <CardContent>
                    <StaggerList className="space-y-1">
                      {rest.map((entry) => {
                        const levelInfo = getLevelForXP(entry.xp);
                        const value = config.getValue(entry);
                        return (
                          <StaggerItem key={entry.id}>
                            <div
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-opacity-50 ${
                                entry.isCurrentUser ? "ring-2 ring-amber-300" : ""
                              }`}
                              style={{
                                background: entry.isCurrentUser
                                  ? "var(--bg-elevated)"
                                  : "transparent",
                              }}
                            >
                              <span
                                className="w-7 text-center text-sm font-bold tabular-nums"
                                style={{ color: "var(--text-muted)" }}
                              >
                                #{entry.rank}
                              </span>
                              <Avatar src={entry.image} name={entry.name ?? "?"} size="sm" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <Link href={`/u/${entry.username}`}>
                                    <span
                                      className="text-sm font-medium hover:underline truncate"
                                      style={{ color: "var(--text-primary)" }}
                                    >
                                      {entry.name ?? entry.username}
                                    </span>
                                  </Link>
                                  {entry.isCurrentUser && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700">
                                      You
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {entry.username && (
                                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                      @{entry.username}
                                    </span>
                                  )}
                                  {entry.school && (
                                    <span className="text-xs hidden sm:inline" style={{ color: "var(--text-muted)" }}>
                                      · {entry.school}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-sm">{levelInfo.icon}</span>
                                <span className="text-xs hidden sm:inline" style={{ color: "var(--text-secondary)" }}>
                                  {levelInfo.name}
                                </span>
                                <Badge variant="secondary" className={`text-xs ${config.color}`}>
                                  {config.formatValue(value)}
                                </Badge>
                              </div>
                            </div>
                          </StaggerItem>
                        );
                      })}
                    </StaggerList>
                  </CardContent>
                </Card>
              )}

              {/* Current user card (if outside top 50) */}
              {myEntryInRest && !rest.find((e) => e.isCurrentUser) && (
                <Card className="border-2 border-amber-300">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 text-center text-sm font-bold tabular-nums text-amber-600">
                        #{myEntryInRest.rank}
                      </span>
                      <Avatar src={myEntryInRest.image} name={myEntryInRest.name ?? "?"} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                            {myEntryInRest.name ?? myEntryInRest.username}
                          </span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700">
                            You
                          </Badge>
                        </div>
                        {myEntryInRest.username && (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            @{myEntryInRest.username}
                          </span>
                        )}
                      </div>
                      <Badge variant="secondary" className={`text-xs ${config.color}`}>
                        {config.formatValue(config.getValue(myEntryInRest))}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </FadeUp>
    </div>
  );
}
