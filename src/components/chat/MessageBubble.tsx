"use client";

import { Avatar } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Reply, Smile, Trash2, Pin } from "lucide-react";
import { useState } from "react";

interface MessageProps {
  message: {
    id: string;
    content: string | null;
    type: string;
    metadata: string | null;
    isEdited: boolean;
    isDeleted: boolean;
    isPinned: boolean;
    replyToId: string | null;
    createdAt: string;
    sender: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
    reactions: {
      emoji: string;
      userId: string;
      user: { name: string | null };
    }[];
  };
  isOwn: boolean;
  replyPreview?: { content: string | null; senderName: string | null } | null;
  onReply?: (messageId: string) => void;
  onReact?: (msgId: string, emoji: string) => void;
  onDelete?: (msgId: string) => void;
  userId?: string;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "💯", "👀"];

export function MessageBubble({
  message,
  isOwn,
  replyPreview,
  onReply,
  onReact,
  onDelete,
  userId,
}: MessageProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
        <div
          className="px-4 py-2 rounded-2xl text-xs italic max-w-[70%]"
          style={{
            background: "var(--bg-elevated)",
            color: "var(--text-muted)",
          }}
        >
          This message was deleted
        </div>
      </div>
    );
  }

  if (message.type === "system") {
    return (
      <div className="flex justify-center my-3">
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{
            background: "var(--bg-elevated)",
            color: "var(--text-muted)",
          }}
        >
          {message.content}
        </span>
      </div>
    );
  }

  // Group reactions by emoji
  const reactionGroups = message.reactions.reduce(
    (acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = [];
      acc[r.emoji].push(r.userId);
      return acc;
    },
    {} as Record<string, string[]>
  );

  return (
    <div
      className={`flex gap-2 mb-2 group ${isOwn ? "flex-row-reverse" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      {!isOwn && (
        <Avatar
          src={message.sender.image}
          name={message.sender.name}
          size="sm"
          className="mt-1 shrink-0"
        />
      )}
      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {!isOwn && (
          <span
            className="text-[10px] font-medium mb-0.5 px-1"
            style={{ color: "var(--text-muted)" }}
          >
            {message.sender.name}
          </span>
        )}

        {replyPreview && (
          <div
            className="text-[10px] px-3 py-1 rounded-t-xl mb-0.5 truncate max-w-full border-l-2 border-cyan-400"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-muted)",
            }}
          >
            {replyPreview.senderName}: {replyPreview.content || "[media]"}
          </div>
        )}

        <div className="relative">
          <div
            className={`px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
              isOwn
                ? "rounded-tr-md bg-gradient-to-br from-cyan-500 to-teal-500 text-white"
                : "rounded-tl-md"
            }`}
            style={
              !isOwn
                ? {
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                  }
                : undefined
            }
          >
            {message.content}
          </div>

          {/* Action buttons */}
          {showActions && (
            <div
              className={`absolute top-0 ${isOwn ? "left-0 -translate-x-full" : "right-0 translate-x-full"} flex items-center gap-0.5 px-1`}
            >
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-1 rounded-lg transition-colors hover:bg-black/5"
                style={{ color: "var(--text-muted)" }}
              >
                <Smile className="h-3.5 w-3.5" />
              </button>
              {onReply && (
                <button
                  onClick={() => onReply(message.id)}
                  className="p-1 rounded-lg transition-colors hover:bg-black/5"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Reply className="h-3.5 w-3.5" />
                </button>
              )}
              {isOwn && onDelete && (
                <button
                  onClick={() => onDelete(message.id)}
                  className="p-1 rounded-lg transition-colors hover:bg-red-50"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Reaction picker */}
          {showReactions && (
            <div
              className={`absolute -bottom-8 ${isOwn ? "right-0" : "left-0"} flex items-center gap-1 p-1 rounded-full shadow-lg border z-10`}
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-normal)",
              }}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact?.(message.id, emoji);
                    setShowReactions(false);
                  }}
                  className="text-sm p-1 rounded-full hover:bg-black/5 transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reactions display */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(reactionGroups).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReact?.(message.id, emoji)}
                className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-colors ${
                  users.includes(userId || "")
                    ? "border-cyan-300 bg-cyan-50"
                    : ""
                }`}
                style={{
                  background: users.includes(userId || "")
                    ? undefined
                    : "var(--bg-elevated)",
                  borderColor: users.includes(userId || "")
                    ? undefined
                    : "var(--border-subtle)",
                }}
              >
                <span>{emoji}</span>
                <span style={{ color: "var(--text-muted)" }}>{users.length}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 mt-0.5 px-1">
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
          {message.isEdited && (
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              · edited
            </span>
          )}
          {message.isPinned && <Pin className="h-2.5 w-2.5 text-amber-500" />}
        </div>
      </div>
    </div>
  );
}
