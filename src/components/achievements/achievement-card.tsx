"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { categoryLabels } from "@/lib/validations/achievement";
import { formatDate, parseJsonArray } from "@/lib/utils";
import { Trophy, Star, Calendar, Building2, MoreVertical, Pencil, Trash2, Send, ExternalLink } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { VerificationBadge, VisibilityToggle } from "./verification-badge";

interface Achievement {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  date: string;
  issuingOrg?: string | null;
  tags?: string | null;
  isHighlight?: boolean;
  verificationStatus?: string;
  verificationLevel?: number;
  isPublic?: boolean;
  proofDocumentUrl?: string | null;
  proofDocumentType?: string;
  externalLink?: string | null;
}

interface AchievementCardProps {
  achievement: Achievement;
  view?: "grid" | "list";
  onDelete?: (id: string) => void;
  onRequestReview?: (id: string) => void;
  onToggleVisibility?: (id: string, isPublic: boolean) => void;
}

const categoryColors: Record<string, "primary" | "secondary" | "success" | "warning" | "error" | "info" | "default"> = {
  academic: "primary",
  competition: "warning",
  certificate: "success",
  extracurricular: "secondary",
  community_service: "info",
  sports: "error",
  creative: "secondary",
  leadership: "warning",
  other: "default",
};

export function AchievementCard({
  achievement,
  view = "grid",
  onDelete,
  onRequestReview,
  onToggleVisibility,
}: AchievementCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const tags = parseJsonArray(achievement.tags);

  const vLevel = achievement.verificationLevel ?? 0;
  const vStatus = achievement.verificationStatus ?? "SELF_REPORTED";
  const isPublic = achievement.isPublic ?? true;
  const isVerified = vStatus === "VERIFIED" || vLevel >= 2;
  const canRequestReview = vLevel >= 1 && vStatus !== "UNDER_REVIEW" && vStatus !== "VERIFIED";

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  if (view === "list") {
    return (
      <Card className="!p-4">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg shrink-0 ${isVerified ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-primary-100 dark:bg-primary-900/30"}`}>
            <Trophy className={`h-5 w-5 ${isVerified ? "text-emerald-500" : "text-primary-500"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/achievements/${achievement.id}`} className="text-sm font-semibold truncate hover:text-primary-500 transition-colors">
                {achievement.title}
              </Link>
              {achievement.isHighlight && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />}
              <VerificationBadge level={vLevel} status={vStatus} isPublic={isPublic} />
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(achievement.date)}</span>
              {achievement.issuingOrg && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{achievement.issuingOrg}</span>}
            </div>
          </div>
          <Badge variant={categoryColors[achievement.category] || "default"}>
            {categoryLabels[achievement.category] || achievement.category}
          </Badge>
          {onToggleVisibility && (
            <VisibilityToggle
              isPublic={isPublic}
              onToggle={(val) => onToggleVisibility(achievement.id, val)}
            />
          )}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </button>
            {menuOpen && (
              <MenuDropdown
                achievement={achievement}
                canRequestReview={canRequestReview}
                onDelete={onDelete}
                onRequestReview={onRequestReview}
                onClose={() => setMenuOpen(false)}
              />
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card hover className={`relative group ${!isPublic ? "opacity-75" : ""}`}>
      <div className="absolute top-4 right-4 flex items-center gap-1" ref={menuRef}>
        {onToggleVisibility && (
          <VisibilityToggle
            isPublic={isPublic}
            onToggle={(val) => onToggleVisibility(achievement.id, val)}
          />
        )}
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
          <MoreVertical className="h-4 w-4 text-gray-400" />
        </button>
        {menuOpen && (
          <MenuDropdown
            achievement={achievement}
            canRequestReview={canRequestReview}
            onDelete={onDelete}
            onRequestReview={onRequestReview}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>

      <Link href={`/achievements/${achievement.id}`} className="block">
        <div className="flex items-start gap-3 mb-3">
          <div className={`p-2 rounded-lg shrink-0 ${isVerified ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-primary-100 dark:bg-primary-900/30"}`}>
            <Trophy className={`h-5 w-5 ${isVerified ? "text-emerald-500" : "text-primary-500"}`} />
          </div>
          <div className="flex-1 min-w-0 pr-10">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate">{achievement.title}</h3>
              {achievement.isHighlight && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant={categoryColors[achievement.category] || "default"}>
                {categoryLabels[achievement.category] || achievement.category}
              </Badge>
              <VerificationBadge level={vLevel} status={vStatus} isPublic={isPublic} />
            </div>
          </div>
        </div>

        {achievement.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {achievement.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(achievement.date)}</span>
          {achievement.issuingOrg && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{achievement.issuingOrg}</span>}
          {achievement.externalLink && (
            <span className="flex items-center gap-1 text-blue-500">
              <ExternalLink className="h-3 w-3" />Proof
            </span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400">
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>
    </Card>
  );
}

function MenuDropdown({
  achievement,
  canRequestReview,
  onDelete,
  onRequestReview,
  onClose,
}: {
  achievement: Achievement;
  canRequestReview: boolean;
  onDelete?: (id: string) => void;
  onRequestReview?: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-lg z-10 py-1">
      <Link
        href={`/achievements/${achievement.id}/edit`}
        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5"
        onClick={onClose}
      >
        <Pencil className="h-3.5 w-3.5" /> Edit
      </Link>
      {canRequestReview && onRequestReview && (
        <button
          onClick={() => { onRequestReview(achievement.id); onClose(); }}
          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 w-full text-left text-blue-600 dark:text-blue-400"
        >
          <Send className="h-3.5 w-3.5" /> Request Review
        </button>
      )}
      <button
        onClick={() => { onDelete?.(achievement.id); onClose(); }}
        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 w-full text-left"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </button>
    </div>
  );
}
