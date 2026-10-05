"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, MessageCircle, Clock, Check } from "lucide-react";
import Link from "next/link";

interface UserCardProps {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    school: string | null;
    grade: string | null;
    bio: string | null;
    level?: string;
  };
  friendStatus?: "none" | "pending" | "friends";
  onAddFriend?: () => void;
  onMessage?: () => void;
  isLoading?: boolean;
}

export function UserCard({
  user,
  friendStatus = "none",
  onAddFriend,
  onMessage,
  isLoading,
}: UserCardProps) {
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <Link href={user.username ? `/u/${user.username}` : "#"}>
        <Avatar src={user.image} name={user.name} size="lg" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={user.username ? `/u/${user.username}` : "#"}
          className="font-semibold text-sm hover:underline truncate block"
          style={{ color: "var(--text-primary)" }}
        >
          {user.name || "Anonymous"}
        </Link>
        {user.username && (
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
            @{user.username}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {user.school && (
            <span
              className="text-xs truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {user.school}
              {user.grade && ` · ${user.grade}`}
            </span>
          )}
          {user.level && (
            <Badge variant="teal" className="text-[10px]">
              {user.level}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        {friendStatus === "none" && onAddFriend && (
          <Button
            size="sm"
            variant="outline"
            onClick={onAddFriend}
            loading={isLoading}
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        )}
        {friendStatus === "pending" && (
          <Button size="sm" variant="ghost" disabled>
            <Clock className="h-4 w-4" />
            Pending
          </Button>
        )}
        {friendStatus === "friends" && (
          <>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              Friends
            </Badge>
            {onMessage && (
              <Button size="sm" variant="outline" onClick={onMessage}>
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
