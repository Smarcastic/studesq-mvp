"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { PollMessage } from "@/components/chat/PollMessage";
import { FlashcardShareMessage, PomodoroInviteMessage, QuizMessage } from "@/components/chat/SpecialMessages";
import {
  useConversation,
  useMessages,
  useSendMessage,
  useMarkRead,
  useSendTyping,
  useMessagePoll,
  useToggleReaction,
  usePollVote,
} from "@/hooks/use-conversations";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface MessageType {
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
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; senderName: string; content: string } | null>(null);
  const [latestTimestamp, setLatestTimestamp] = useState<string | null>(null);

  const { data: conv, isLoading: convLoading } = useConversation(id);
  const { data: messagesData, isLoading: msgsLoading, fetchNextPage, hasNextPage } = useMessages(id);
  const sendMessage = useSendMessage(id);
  const markRead = useMarkRead(id);
  const sendTyping = useSendTyping(id);
  const toggleReaction = useToggleReaction(id);
  const pollVote = usePollVote(id);
  const { data: pollData } = useMessagePoll(id, latestTimestamp);

  // Flatten messages from infinite query pages
  const allMessages: MessageType[] = (messagesData?.pages
    ?.flatMap((p) => p.messages as unknown as MessageType[])
    ?.reverse()) ?? [];

  // Update latest timestamp for polling
  useEffect(() => {
    if (allMessages.length > 0) {
      const latest = allMessages[allMessages.length - 1]?.createdAt;
      if (latest) setLatestTimestamp(latest);
    }
  }, [allMessages]);

  // Mark as read when opening
  useEffect(() => {
    if (conv) markRead.mutate();
  }, [conv?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length, pollData?.messages?.length]);

  const otherMembers = conv?.members?.filter(
    (m: { userId: string }) => m.userId !== userId
  ) || [];
  const displayName =
    conv?.type === "dm"
      ? otherMembers[0]?.user?.name || "Chat"
      : conv?.name || "Group Chat";

  const typingNames: string[] = pollData?.typing || [];

  const handleReply = useCallback((messageId: string) => {
    const msg = allMessages.find((m) => m.id === messageId);
    if (msg) {
      setReplyTo({
        id: msg.id,
        senderName: msg.sender.name || "Unknown",
        content: msg.content || "[media]",
      });
    }
  }, [allMessages]);

  const handleDeleteMessage = async (msgId: string) => {
    await fetch(`/api/conversations/${id}/messages/${msgId}`, {
      method: "DELETE",
    });
  };

  const renderMessage = (msg: MessageType) => {
    const isOwn = msg.sender.id === userId;

    // Special message types
    if (msg.type === "poll" && msg.metadata) {
      return (
        <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
          <PollMessage
            metadata={msg.metadata}
            userId={userId}
            onVote={(optionIndex) =>
              pollVote.mutate({ messageId: msg.id, optionIndex })
            }
          />
        </div>
      );
    }
    if (msg.type === "flashcard_share" && msg.metadata) {
      return (
        <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
          <FlashcardShareMessage metadata={msg.metadata} />
        </div>
      );
    }
    if (msg.type === "pomodoro_invite" && msg.metadata) {
      return (
        <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
          <PomodoroInviteMessage metadata={msg.metadata} />
        </div>
      );
    }
    if (msg.type === "quiz" && msg.metadata) {
      return (
        <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
          <QuizMessage metadata={msg.metadata} />
        </div>
      );
    }

    return (
      <MessageBubble
        key={msg.id}
        message={msg}
        isOwn={isOwn}
        userId={userId}
        onReply={handleReply}
        onReact={(msgId, emoji) => toggleReaction.mutate({ msgId, emoji })}
        onDelete={handleDeleteMessage}
      />
    );
  };

  return (
    <div
      className="flex flex-col h-[calc(100vh-4rem)] -m-6 rounded-2xl border overflow-hidden"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <Link href="/chat">
          <Button variant="ghost" size="sm" className="p-1">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        {convLoading ? (
          <Skeleton className="h-10 w-40" />
        ) : (
          <>
            <Avatar
              src={conv?.type === "dm" ? otherMembers[0]?.user?.image : conv?.avatarUrl}
              name={displayName}
              size="md"
            />
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                {displayName}
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {conv?.type === "group"
                  ? `${conv?.members?.length || 0} members`
                  : ""}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {hasNextPage && (
          <div className="flex justify-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchNextPage()}
            >
              Load older messages
            </Button>
          </div>
        )}

        {msgsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-48" />
            ))}
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No messages yet. Say hi!
            </p>
          </div>
        ) : (
          allMessages.map(renderMessage)
        )}

        {/* New messages from polling */}
        {pollData?.messages?.map((msg: MessageType) => renderMessage(msg))}

        <TypingIndicator names={typingNames} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={(data) => sendMessage.mutate(data)}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onTyping={() => sendTyping.mutate()}
        disabled={sendMessage.isPending}
      />
    </div>
  );
}
