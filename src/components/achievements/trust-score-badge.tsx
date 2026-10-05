"use client";

import { ShieldCheck } from "lucide-react";

interface TrustScoreBadgeProps {
  score: number;
  verifiedCount: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

function getTrustTier(score: number) {
  if (score >= 200) return { label: "Diamond", color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20", border: "border-cyan-200 dark:border-cyan-800", ring: "ring-cyan-400/30" };
  if (score >= 100) return { label: "Gold", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800", ring: "ring-amber-400/30" };
  if (score >= 50) return { label: "Silver", color: "text-gray-400", bg: "bg-gray-100 dark:bg-gray-800/60", border: "border-gray-200 dark:border-gray-700", ring: "ring-gray-400/20" };
  if (score >= 10) return { label: "Bronze", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800", ring: "ring-orange-400/20" };
  return { label: "Starter", color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-800/40", border: "border-gray-200 dark:border-gray-700", ring: "ring-gray-300/10" };
}

export function TrustScoreBadge({
  score,
  verifiedCount,
  size = "sm",
  showLabel = true,
}: TrustScoreBadgeProps) {
  const tier = getTrustTier(score);

  const sizeClasses = {
    sm: "text-xs px-2.5 py-1 gap-1.5",
    md: "text-sm px-3 py-1.5 gap-2",
    lg: "text-base px-4 py-2 gap-2.5",
  }[size];

  const iconSize = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size];

  return (
    <div
      className={`inline-flex items-center ${sizeClasses} rounded-full font-medium border ${tier.bg} ${tier.border} ring-1 ${tier.ring}`}
      title={`Trust Score: ${score} (${tier.label}) — ${verifiedCount} verified achievement${verifiedCount !== 1 ? "s" : ""}`}
    >
      <ShieldCheck className={`${iconSize} ${tier.color}`} />
      <span className={tier.color}>{score}</span>
      {showLabel && (
        <span className="text-gray-500 dark:text-gray-400">Trust</span>
      )}
    </div>
  );
}

/**
 * Larger trust score display for profile pages.
 */
export function TrustScoreDisplay({
  score,
  verifiedCount,
  totalCount,
}: {
  score: number;
  verifiedCount: number;
  totalCount: number;
}) {
  const tier = getTrustTier(score);

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${tier.bg} ${tier.border}`}>
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/80 dark:bg-black/20 shadow-sm">
        <ShieldCheck className={`h-6 w-6 ${tier.color}`} />
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${tier.color}`}>{score}</span>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Trust Score
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className={`text-xs font-semibold uppercase tracking-wider ${tier.color}`}>
            {tier.label}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {verifiedCount} of {totalCount} verified
          </span>
        </div>
      </div>
    </div>
  );
}
