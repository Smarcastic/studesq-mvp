"use client";

import { useState } from "react";
import { Shield, ShieldCheck, ShieldAlert, Award, Lock, Eye, EyeOff } from "lucide-react";

interface VerificationBadgeProps {
  level: number;
  status: string;
  isPublic?: boolean;
  size?: "sm" | "md";
  showTooltip?: boolean;
}

const BADGE_CONFIG: Record<number, {
  label: string;
  icon: typeof Shield;
  colorClasses: string;
  bgClasses: string;
  description: string;
}> = {
  0: {
    label: "Self Reported",
    icon: Shield,
    colorClasses: "text-gray-400 dark:text-gray-500",
    bgClasses: "bg-gray-100 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700",
    description: "This achievement was self-reported by the student.",
  },
  1: {
    label: "Document Uploaded",
    icon: ShieldAlert,
    colorClasses: "text-blue-500 dark:text-blue-400",
    bgClasses: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    description: "Supporting documentation has been uploaded.",
  },
  2: {
    label: "Verified",
    icon: ShieldCheck,
    colorClasses: "text-emerald-500 dark:text-emerald-400",
    bgClasses: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    description: "This achievement has been verified by an administrator.",
  },
  3: {
    label: "Institution Confirmed",
    icon: Award,
    colorClasses: "text-amber-500 dark:text-amber-400",
    bgClasses: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    description: "Confirmed by the issuing institution.",
  },
};

export function VerificationBadge({
  level,
  status,
  isPublic = true,
  size = "sm",
  showTooltip = true,
}: VerificationBadgeProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const config = BADGE_CONFIG[level] ?? BADGE_CONFIG[0];
  const Icon = config.icon;

  const isRejected = status === "REJECTED";
  const isUnderReview = status === "UNDER_REVIEW";

  const sizeClasses = size === "sm"
    ? "text-[10px] px-1.5 py-0.5 gap-1"
    : "text-xs px-2 py-1 gap-1.5";

  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  if (isRejected) {
    return (
      <span className={`inline-flex items-center ${sizeClasses} rounded-full font-medium border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-500 dark:text-red-400`}>
        <ShieldAlert className={iconSize} />
        Rejected
      </span>
    );
  }

  return (
    <span className="relative inline-flex items-center gap-1">
      <span
        className={`inline-flex items-center ${sizeClasses} rounded-full font-medium border ${config.bgClasses} ${config.colorClasses} cursor-default`}
        onMouseEnter={() => showTooltip && setTooltipOpen(true)}
        onMouseLeave={() => setTooltipOpen(false)}
      >
        <Icon className={iconSize} />
        {isUnderReview ? "Under Review" : config.label}
      </span>

      {!isPublic && (
        <span className="inline-flex items-center text-gray-400 dark:text-gray-500" title="Private">
          <Lock className="h-3 w-3" />
        </span>
      )}

      {/* Tooltip */}
      {showTooltip && tooltipOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 rounded-lg bg-gray-900 dark:bg-gray-800 text-white text-[11px] leading-relaxed shadow-xl z-50 pointer-events-none">
          <p className="font-semibold mb-0.5">
            Verification Level {level} — {config.label}
          </p>
          <p className="text-gray-300 text-[10px]">{config.description}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800" />
        </div>
      )}
    </span>
  );
}

/**
 * Inline visibility toggle for achievement cards.
 */
export function VisibilityToggle({
  isPublic,
  onToggle,
  size = "sm",
}: {
  isPublic: boolean;
  onToggle: (value: boolean) => void;
  size?: "sm" | "md";
}) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(!isPublic);
      }}
      className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
      title={isPublic ? "Visible on public profile" : "Hidden from public profile"}
    >
      {isPublic ? (
        <Eye className={`${iconSize} text-gray-400`} />
      ) : (
        <EyeOff className={`${iconSize} text-gray-300 dark:text-gray-600`} />
      )}
    </button>
  );
}
