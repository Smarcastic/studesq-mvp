"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Lock, Globe } from "lucide-react";
import Link from "next/link";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description: string | null;
    type: string;
    school: string | null;
    isPublic: boolean;
    avatarUrl: string | null;
    _count?: { members: number };
  };
  isMember?: boolean;
  onJoin?: () => void;
  isLoading?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  school: "bg-blue-50 text-blue-600",
  class: "bg-emerald-50 text-emerald-600",
  study: "bg-purple-50 text-purple-600",
  custom: "bg-amber-50 text-amber-600",
};

export function GroupCard({ group, isMember, onJoin, isLoading }: GroupCardProps) {
  return (
    <div
      className="p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
          {group.avatarUrl ? (
            <img
              src={group.avatarUrl}
              alt={group.name}
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            group.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/groups/${group.id}`}
              className="font-semibold text-sm hover:underline truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {group.name}
            </Link>
            {group.isPublic ? (
              <Globe className="h-3 w-3 text-emerald-500 shrink-0" />
            ) : (
              <Lock className="h-3 w-3 shrink-0" style={{ color: "var(--text-muted)" }} />
            )}
          </div>
          {group.description && (
            <p
              className="text-xs mt-0.5 line-clamp-2"
              style={{ color: "var(--text-muted)" }}
            >
              {group.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[group.type] || TYPE_COLORS.custom}`}
            >
              {group.type}
            </span>
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <Users className="h-3 w-3" />
              {group._count?.members || 0}
            </span>
          </div>
        </div>
        <div className="shrink-0">
          {isMember ? (
            <Link href={`/groups/${group.id}`}>
              <Button size="sm" variant="outline">
                View
              </Button>
            </Link>
          ) : (
            group.isPublic && (
              <Button
                size="sm"
                onClick={onJoin}
                loading={isLoading}
              >
                Join
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
