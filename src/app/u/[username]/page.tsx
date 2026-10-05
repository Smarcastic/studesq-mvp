"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  GraduationCap,
  MapPin,
  Calendar,
  Target,
  Star,
  Flame,
  Shield,
  Share2,
  ShieldCheck,
  CheckCircle2,
  Filter,
  ExternalLink,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeUp, StaggerList, StaggerItem, CountUp } from "@/components/ui/motion";
import { TrustScoreDisplay } from "@/components/achievements/trust-score-badge";
import { VerificationBadge } from "@/components/achievements/verification-badge";
import { getLevelForXP, getLevelProgress } from "@/lib/xp-system";
import { formatDate } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

interface PublicAchievement {
  id: string;
  title: string;
  category: string;
  date: string;
  verificationStatus: string;
  verificationLevel: number;
  externalLink?: string | null;
  isHighlight: boolean;
}

interface PublicProfile {
  name: string;
  bio: string;
  school: string;
  grade: string;
  location: string;
  graduationYear: number;
  interests: string[];
  skills: string[];
  xp: number;
  level: string;
  profileViews: number;
  trustScore: number;
  verifiedAchievementsCount: number;
  achievements: PublicAchievement[];
  stats: {
    totalStudyHours: number;
    streak: number;
    gpa: number | null;
    achievementCount: number;
    goalsCompleted: number;
  };
}

// ============================================================
// Main Page
// ============================================================

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  const { data: profile, isLoading, error } = useQuery<PublicProfile>({
    queryKey: ["public-profile", username],
    queryFn: () =>
      fetch(`/api/profile/public/${username}`).then((r) => {
        if (!r.ok) throw new Error("Profile not found");
        return r.json();
      }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-48 rounded-2xl" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md text-center">
          <div className="py-12">
            <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Profile Not Found
            </h2>
            <p className="text-slate-500">
              This profile is private or doesn&apos;t exist.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const levelInfo = getLevelForXP(profile.xp);
  const levelProgress = getLevelProgress(profile.xp);

  // Filter achievements: only show public (already filtered by API), then by verified toggle
  const filteredAchievements = showVerifiedOnly
    ? profile.achievements.filter((a) => a.verificationLevel >= 2)
    : profile.achievements;

  const highlights = filteredAchievements.filter((a) => a.isHighlight);
  const otherAchievements = filteredAchievements.filter((a) => !a.isHighlight);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500 via-teal-500 to-indigo-600 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute w-96 h-96 -top-48 -right-48 bg-white rounded-full blur-3xl" />
          <div className="absolute w-64 h-64 -bottom-32 -left-32 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-12">
          <FadeUp>
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="h-24 w-24 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-4xl font-bold shrink-0">
                {profile.name?.charAt(0) || "?"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h1 className="text-3xl font-bold">{profile.name}</h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm">
                    {levelInfo.icon} {levelInfo.name}
                  </span>
                  {/* Trust Score Pill in Header */}
                  {profile.trustScore > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {profile.trustScore} Trust
                    </span>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-white/80 mt-1 line-clamp-2">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/70">
                  {profile.school && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" /> {profile.school}
                    </span>
                  )}
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {profile.location}
                    </span>
                  )}
                  {profile.graduationYear && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Class of{" "}
                      {profile.graduationYear}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 -mt-8 pb-12 space-y-6">
        {/* Trust Score Display */}
        <FadeUp delay={0.05}>
          <TrustScoreDisplay
            score={profile.trustScore}
            verifiedCount={profile.verifiedAchievementsCount}
            totalCount={profile.stats.achievementCount}
          />
        </FadeUp>

        {/* Stats Grid */}
        <FadeUp delay={0.1}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Study Hours"
              value={profile.stats.totalStudyHours}
              icon={<Flame className="h-5 w-5 text-orange-500" />}
            />
            <StatCard
              label="Streak"
              value={profile.stats.streak}
              suffix=" days"
              icon={<Target className="h-5 w-5 text-cyan-500" />}
            />
            <StatCard
              label="Achievements"
              value={profile.stats.achievementCount}
              icon={<Trophy className="h-5 w-5 text-amber-500" />}
            />
            {profile.stats.gpa !== null && (
              <StatCard
                label="GPA"
                value={profile.stats.gpa}
                decimals={2}
                icon={<Star className="h-5 w-5 text-indigo-500" />}
              />
            )}
          </div>
        </FadeUp>

        {/* XP Progress */}
        <FadeUp delay={0.15}>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{levelInfo.icon}</span>
                <span className="font-semibold text-slate-900">
                  {levelInfo.name}
                </span>
                <Badge variant="teal">{profile.xp} XP</Badge>
              </div>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Level Progress: {levelProgress}%
            </p>
          </Card>
        </FadeUp>

        {/* Skills & Interests */}
        {(profile.interests.length > 0 || profile.skills.length > 0) && (
          <FadeUp delay={0.2}>
            <Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {profile.interests.length > 0 && (
                  <div>
                    <CardTitle className="text-sm mb-3">Interests</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest) => (
                        <Badge key={interest} variant="teal">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {profile.skills.length > 0 && (
                  <div>
                    <CardTitle className="text-sm mb-3">Skills</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <Badge key={skill} variant="info">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </FadeUp>
        )}

        {/* Achievements Section with Verified-Only Filter */}
        {profile.achievements.length > 0 && (
          <FadeUp delay={0.25}>
            <Card>
              {/* Section Header with Filter Toggle */}
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Achievements
                  {profile.verifiedAchievementsCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      {profile.verifiedAchievementsCount} verified
                    </span>
                  )}
                </CardTitle>
                <button
                  onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    showVerifiedOnly
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                      : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  {showVerifiedOnly ? "Verified Only" : "Show All"}
                </button>
              </div>

              {/* Highlighted Achievements */}
              {highlights.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">
                    ⭐ Featured
                  </p>
                  <StaggerList className="space-y-2">
                    {highlights.map((a) => (
                      <StaggerItem key={a.id}>
                        <AchievementRow achievement={a} />
                      </StaggerItem>
                    ))}
                  </StaggerList>
                </div>
              )}

              {/* Divider if both sections */}
              {highlights.length > 0 && otherAchievements.length > 0 && (
                <div className="border-t border-slate-100 my-4" />
              )}

              {/* Other Achievements */}
              {otherAchievements.length > 0 && (
                <StaggerList className="space-y-2">
                  {otherAchievements.map((a) => (
                    <StaggerItem key={a.id}>
                      <AchievementRow achievement={a} />
                    </StaggerItem>
                  ))}
                </StaggerList>
              )}

              {/* Empty state when filter active */}
              <AnimatePresence>
                {filteredAchievements.length === 0 && showVerifiedOnly && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-center py-8"
                  >
                    <ShieldCheck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">
                      No verified achievements yet.
                    </p>
                    <button
                      onClick={() => setShowVerifiedOnly(false)}
                      className="text-xs text-cyan-500 hover:underline mt-1"
                    >
                      Show all achievements
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </FadeUp>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-4">
          <p>
            Powered by{" "}
            <span className="font-semibold text-slate-500">
              Studes<span className="text-cyan-500">Q</span>
            </span>{" "}
            — Student Growth Platform
          </p>
          <p className="mt-1">{profile.profileViews} profile views</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// StatCard
// ============================================================

function StatCard({
  label,
  value,
  suffix = "",
  decimals = 0,
  icon,
}: {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-2xl font-bold text-slate-900">
        <CountUp value={value} decimals={decimals} suffix={suffix} />
      </div>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </Card>
  );
}

// ============================================================
// AchievementRow — verification-aware
// ============================================================

function AchievementRow({
  achievement,
}: {
  achievement: PublicAchievement;
}) {
  const isVerified = achievement.verificationLevel >= 2;
  const isUnverified = achievement.verificationLevel === 0;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
        isVerified
          ? "bg-emerald-50/60 hover:bg-emerald-50"
          : isUnverified
          ? "bg-slate-50/60 hover:bg-slate-50 opacity-65"
          : "bg-slate-50 hover:bg-slate-100"
      }`}
    >
      {/* Icon */}
      <div
        className={`p-2 rounded-lg shrink-0 ${
          isVerified ? "bg-emerald-100" : "bg-amber-50"
        }`}
      >
        <Trophy
          className={`h-4 w-4 ${
            isVerified ? "text-emerald-500" : "text-amber-500"
          }`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`text-sm font-medium truncate ${
              isUnverified ? "text-slate-500" : "text-slate-900"
            }`}
          >
            {achievement.title}
          </p>
          <VerificationBadge
            level={achievement.verificationLevel}
            status={achievement.verificationStatus}
            showTooltip
            size="sm"
          />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-slate-400">{formatDate(achievement.date)}</p>
          {achievement.externalLink && (
            <a
              href={achievement.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[10px] text-cyan-500 hover:text-cyan-600 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-2.5 w-2.5" />
              Proof
            </a>
          )}
        </div>
      </div>

      {/* Category Badge */}
      <Badge variant={achievement.isHighlight ? "teal" : "default"}>
        {achievement.category}
      </Badge>
    </div>
  );
}
