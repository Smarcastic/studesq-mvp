"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FriendRequestCardProps {
  request: {
    id: string;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
      school: string | null;
    };
  };
  type: "incoming" | "outgoing";
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  isLoading?: boolean;
}

export function FriendRequestCard({
  request,
  type,
  onAccept,
  onReject,
  isLoading,
}: FriendRequestCardProps) {
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-2xl border"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <Avatar src={request.user.image} name={request.user.name} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
          {request.user.name || "Anonymous"}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {request.user.username && `@${request.user.username} · `}
          {formatDistanceToNow(new Date(request.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
      {type === "incoming" ? (
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => onAccept?.(request.id)}
            loading={isLoading}
          >
            <Check className="h-4 w-4" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onReject?.(request.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <span
          className="text-xs font-medium px-3 py-1 rounded-full"
          style={{
            background: "var(--bg-elevated)",
            color: "var(--text-muted)",
          }}
        >
          Pending
        </span>
      )}
    </div>
  );
}
