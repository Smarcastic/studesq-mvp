"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { FadeUp, CountUp } from "@/components/ui/motion";
import { useToast } from "@/components/ui/toast";
import { parseJsonArray, formatDate } from "@/lib/utils";
import {
  Pencil,
  MapPin,
  GraduationCap,
  Calendar,
  Lock,
  Flame,
  Timer,
  Trophy,
  Zap,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import {
  BADGES,
  RARITY_COLORS,
  checkBadgeEligibility,
  type BadgeStats,
} from "@/lib/badges";
import { getLevelForXP, formatXP } from "@/lib/xp-system";

interface DashStats {
  stats: {
    achievements: number;
    studyMinutes: number;
    streak: number;
  };
  badgeStats: BadgeStats;
}

interface XPData {
  xp: number;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () =>
      fetch("/api/profile").then((r) => {
        if (!r.ok) throw new Error("API error");
        return r.json();
      }),
  });

  const { data: dashData } = useQuery<DashStats>({
    queryKey: ["dashboard"],
    queryFn: () =>
      fetch("/api/dashboard").then((r) => {
        if (!r.ok) throw new Error("API error");
        return r.json();
      }),
  });

  const { data: xpData } = useQuery<XPData>({
    queryKey: ["xp"],
    queryFn: () =>
      fetch("/api/xp").then((r) => {
        if (!r.ok) throw new Error("API error");
        return r.json();
      }),
  });

  const earnedBadgeIds = dashData?.badgeStats
    ? checkBadgeEligibility(dashData.badgeStats)
    : [];

  const levelInfo = xpData ? getLevelForXP(xpData.xp) : null;

  const handleCopyProfile = async () => {
    const text = [
      profile?.name,
      profile?.bio,
      profile?.school && `${profile.school}${profile.grade ? ` - ${profile.grade}` : ""}`,
      profile?.location,
    ]
      .filter(Boolean)
      .join(" | ");

    try {
      await navigator.clipboard.writeText(text || "Check out my StudesQ profile!");
      setCopied(true);
      toast("Profile info copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Failed to copy", "error");
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Profile" />
        <Card className="p-8">
          <div className="flex items-start gap-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-3 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const interests = parseJsonArray(profile?.interests);
  const languages = parseJsonArray(profile?.languages);
  const skills = parseJsonArray(profile?.skills);

  return (
    <div>
      <PageHeader
        title="My Profile"
        action={
          <div className="flex gap-2">
            {profile?.username && (
              <Link href={`/u/${profile.username}`} target="_blank">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="h-4 w-4" />
                  Public Profile
                </Button>
              </Link>
            )}
            <Link href="/profile/edit">
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Hero Card */}
        <FadeUp>
          <Card className="p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar src={profile?.image} name={profile?.name} size="xl" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold">
                  {profile?.name || "Your Name"}
                </h2>
                {profile?.username && (
                  <p className="text-sm font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                    @{profile.username}
                  </p>
                )}
                <p className="mt-1" style={{ color: "var(--text-muted)" }}>
                  {profile?.email}
                </p>
                {profile?.bio && (
                  <p
                    className="mt-3"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {profile.bio}
                  </p>
                )}
                <div
                  className="flex flex-wrap gap-4 mt-4 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  {profile?.school && (
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4" />
                      {profile.school}
                      {profile.grade && ` - ${profile.grade}`}
                    </span>
                  )}
                  {profile?.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </span>
                  )}
                  {profile?.createdAt && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Joined {formatDate(profile.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </FadeUp>

        {/* Trust Score Banner */}
        {(profile?.trustScore ?? 0) > 0 && (
          <FadeUp delay={0.04}>
            <div className="flex items-center gap-4 p-4 rounded-2xl border bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-100">
              <div className="p-3 rounded-xl bg-emerald-100 shrink-0">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-900">
                  Trust Score: {profile?.trustScore}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {profile?.verifiedAchievementsCount ?? 0} verified achievement{(profile?.verifiedAchievementsCount ?? 0) !== 1 ? "s" : ""} · Score increases as you verify more achievements
                </p>
              </div>
              {profile?.username && (
                <Link href={`/u/${profile.username}`} target="_blank">
                  <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-100 gap-1 shrink-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Share
                  </Button>
                </Link>
              )}
            </div>
          </FadeUp>
        )}

        {/* Stats Overview */}
        <FadeUp delay={0.05}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ProfileStat
              icon={<Timer className="h-5 w-5 text-cyan-500" />}
              label="Study Time"
              value={
                dashData?.stats?.studyMinutes
                  ? dashData.stats.studyMinutes > 60
                    ? Math.round(dashData.stats.studyMinutes / 60)
                    : dashData.stats.studyMinutes
                  : 0
              }
              suffix={
                dashData?.stats?.studyMinutes && dashData.stats.studyMinutes > 60
                  ? "h"
                  : "m"
              }
            />
            <ProfileStat
              icon={<Flame className="h-5 w-5 text-orange-500" />}
              label="Streak"
              value={dashData?.stats?.streak || 0}
              suffix=" days"
            />
            <ProfileStat
              icon={<Trophy className="h-5 w-5 text-amber-500" />}
              label="Achievements"
              value={dashData?.stats?.achievements || 0}
              suffix=""
            />
            <ProfileStat
              icon={<Zap className="h-5 w-5 text-indigo-500" />}
              label="XP Level"
              value={0}
              suffix=""
              customDisplay={
                levelInfo ? (
                  <span className="flex items-center gap-1.5">
                    <span className="text-lg">{levelInfo.icon}</span>
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {levelInfo.name}
                    </span>
                  </span>
                ) : (
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                    —
                  </span>
                )
              }
            />
          </div>
        </FadeUp>

        {/* Interests, Skills, Languages */}
        <FadeUp delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {interests.length > 0 && (
              <Card>
                <h3 className="font-semibold mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest: string) => (
                    <Badge key={interest} variant="primary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
            {skills.length > 0 && (
              <Card>
                <h3 className="font-semibold mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill: string) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
            {languages.length > 0 && (
              <Card>
                <h3 className="font-semibold mb-3">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang: string) => (
                    <Badge key={lang}>{lang}</Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </FadeUp>

        {/* Badges */}
        {earnedBadgeIds.length > 0 && (
          <FadeUp delay={0.15}>
            <Card>
              <h3 className="font-semibold mb-3">
                🏅 Badges ({earnedBadgeIds.length}/{BADGES.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {BADGES.map((badge) => {
                  const earned = earnedBadgeIds.includes(badge.id);
                  const colors = RARITY_COLORS[badge.rarity];
                  return (
                    <div
                      key={badge.id}
                      className={`
                        flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all duration-200
                        ${
                          earned
                            ? `${colors.bg} ${colors.text} ${colors.border}`
                            : "opacity-50"
                        }
                      `}
                      style={
                        !earned
                          ? {
                              background: "var(--bg-elevated)",
                              borderColor: "var(--border-subtle)",
                              color: "var(--text-muted)",
                            }
                          : undefined
                      }
                    >
                      {earned ? (
                        <span className="text-lg shrink-0">{badge.icon}</span>
                      ) : (
                        <Lock className="h-4 w-4 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-xs truncate">
                          {badge.title}
                        </p>
                        <p
                          className={`text-[10px] truncate ${
                            earned ? "opacity-70" : "opacity-50"
                          }`}
                        >
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </FadeUp>
        )}

        {/* Empty State */}
        {!profile?.bio && interests.length === 0 && skills.length === 0 && (
          <FadeUp delay={0.1}>
            <Card className="text-center py-12">
              <p className="mb-4" style={{ color: "var(--text-muted)" }}>
                Your profile is looking a bit empty. Add some details to make it
                yours!
              </p>
              <Link href="/profile/edit">
                <Button>Complete Your Profile</Button>
              </Link>
            </Card>
          </FadeUp>
        )}
      </div>
    </div>
  );
}

function ProfileStat({
  icon,
  label,
  value,
  suffix,
  customDisplay,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix: string;
  customDisplay?: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div
          className="p-2.5 rounded-xl"
          style={{ background: "var(--bg-elevated)" }}
        >
          {icon}
        </div>
        <div>
          <p
            className="text-xs uppercase tracking-wider font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            {label}
          </p>
          {customDisplay ? (
            <div className="mt-0.5">{customDisplay}</div>
          ) : (
            <div
              className="text-xl font-bold tabular"
              style={{ color: "var(--text-primary)" }}
            >
              <CountUp value={value} duration={1.2} />
              <span
                className="text-sm font-normal ml-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {suffix}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
