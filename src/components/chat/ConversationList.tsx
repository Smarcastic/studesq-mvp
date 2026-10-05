"use client";

import { Avatar } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Conversation {
  id: string;
  type: "dm" | "group";
  name: string | null;
  avatarUrl: string | null;
  lastMessageAt: string | null;
  members: {
    userId: string;
    lastReadAt: string | null;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }[];
  messages?: {
    content: string | null;
    type: string;
    isDeleted: boolean;
    sender: { name: string | null };
  }[];
}

export function ConversationList({
  conversations,
}: {
  conversations: Conversation[];
}) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return (
    <div className="space-y-1">
      {conversations.map((conv) => {
        const otherMembers = conv.members.filter((m) => m.userId !== userId);
        const displayName =
          conv.type === "dm"
            ? otherMembers[0]?.user?.name || "Unknown"
            : conv.name || "Group Chat";
        const displayImage =
          conv.type === "dm" ? otherMembers[0]?.user?.image : conv.avatarUrl;

        const lastMsg = conv.messages?.[0];
        const myMember = conv.members.find((m) => m.userId === userId);
        const hasUnread =
          conv.lastMessageAt &&
          myMember?.lastReadAt &&
          new Date(conv.lastMessageAt) > new Date(myMember.lastReadAt);

        let preview = "No messages yet";
        if (lastMsg) {
          if (lastMsg.isDeleted) preview = "Message deleted";
          else if (lastMsg.type !== "text") preview = `[${lastMsg.type.replace("_", " ")}]`;
          else preview = lastMsg.content || "";
        }

        return (
          <Link
            key={conv.id}
            href={`/chat/${conv.id}`}
            className="flex items-center gap-3 p-3 rounded-xl transition-colors"
            style={{ background: hasUnread ? "var(--bg-elevated)" : "transparent" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-elevated)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = hasUnread ? "var(--bg-elevated)" : "transparent")
            }
          >
            <div className="relative">
              <Avatar src={displayImage} name={displayName} size="md" />
              {conv.type === "group" && (
                <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-indigo-500 text-white text-[8px] flex items-center justify-center font-bold">
                  {conv.members.length}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p
                  className={`text-sm truncate ${hasUnread ? "font-bold" : "font-medium"}`}
                  style={{ color: "var(--text-primary)" }}
                >
                  {displayName}
                </p>
                {conv.lastMessageAt && (
                  <span className="text-[10px] shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
                    {formatDistanceToNow(new Date(conv.lastMessageAt), {
                      addSuffix: false,
                    })}
                  </span>
                )}
              </div>
              <p
                className={`text-xs truncate mt-0.5 ${hasUnread ? "font-medium" : ""}`}
                style={{ color: hasUnread ? "var(--text-secondary)" : "var(--text-muted)" }}
              >
                {conv.type === "group" && lastMsg?.sender?.name
                  ? `${lastMsg.sender.name}: ${preview}`
                  : preview}
              </p>
            </div>
            {hasUnread && (
              <div className="h-2.5 w-2.5 rounded-full bg-cyan-500 shrink-0" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
