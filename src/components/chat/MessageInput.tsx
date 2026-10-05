"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Send,
  Paperclip,
  X,
  BarChart3,
  HelpCircle,
  Layers,
  Timer,
} from "lucide-react";

interface MessageInputProps {
  onSend: (data: {
    content?: string;
    type?: string;
    metadata?: string;
    replyToId?: string;
  }) => void;
  replyTo?: { id: string; senderName: string; content: string } | null;
  onCancelReply?: () => void;
  onTyping?: () => void;
  disabled?: boolean;
}

type SpecialType = "poll" | "quiz" | "flashcard_share" | "pomodoro_invite";

export function MessageInput({
  onSend,
  replyTo,
  onCancelReply,
  onTyping,
  disabled,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [specialType, setSpecialType] = useState<SpecialType | null>(null);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTypingRef = useRef(0);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [replyTo]);

  const handleTextChange = (val: string) => {
    setText(val);
    // Throttle typing indicator to every 3 seconds
    const now = Date.now();
    if (now - lastTypingRef.current > 3000) {
      lastTypingRef.current = now;
      onTyping?.();
    }
  };

  const handleSend = () => {
    if (specialType === "poll" && pollQuestion) {
      const validOptions = pollOptions.filter((o) => o.trim());
      if (validOptions.length >= 2) {
        onSend({
          type: "poll",
          content: pollQuestion,
          metadata: JSON.stringify({
            question: pollQuestion,
            options: validOptions.map((text) => ({ text, votes: [] })),
          }),
          replyToId: replyTo?.id,
        });
        setPollQuestion("");
        setPollOptions(["", ""]);
        setSpecialType(null);
        onCancelReply?.();
        return;
      }
    }

    if (!text.trim()) return;
    onSend({
      content: text.trim(),
      type: "text",
      replyToId: replyTo?.id,
    });
    setText("");
    onCancelReply?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sendSpecialMessage = (type: SpecialType, metadata: Record<string, unknown>) => {
    onSend({
      type,
      content: type.replace("_", " "),
      metadata: JSON.stringify(metadata),
      replyToId: replyTo?.id,
    });
    setSpecialType(null);
    setShowAttachments(false);
    onCancelReply?.();
  };

  return (
    <div
      className="border-t p-3"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      {/* Reply preview */}
      {replyTo && (
        <div
          className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg text-xs border-l-2 border-cyan-400"
          style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
        >
          <span className="flex-1 truncate">
            Replying to <strong>{replyTo.senderName}</strong>: {replyTo.content}
          </span>
          <button onClick={onCancelReply} className="shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Special message creator: Poll */}
      {specialType === "poll" && (
        <div
          className="mb-3 p-3 rounded-xl space-y-2"
          style={{ background: "var(--bg-elevated)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              Create Poll
            </span>
            <button onClick={() => setSpecialType(null)}>
              <X className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
            </button>
          </div>
          <input
            className="w-full text-sm p-2 rounded-lg border outline-none"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
            placeholder="Ask a question..."
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
          />
          {pollOptions.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="flex-1 text-sm p-2 rounded-lg border outline-none"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => {
                  const next = [...pollOptions];
                  next[i] = e.target.value;
                  setPollOptions(next);
                }}
              />
              {i >= 2 && (
                <button
                  onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                >
                  <X className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                </button>
              )}
            </div>
          ))}
          {pollOptions.length < 6 && (
            <button
              onClick={() => setPollOptions([...pollOptions, ""])}
              className="text-xs font-medium text-cyan-500"
            >
              + Add option
            </button>
          )}
        </div>
      )}

      {/* Main input row */}
      <div className="flex items-end gap-2">
        <div className="relative">
          <button
            onClick={() => setShowAttachments(!showAttachments)}
            className="p-2 rounded-xl transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <Paperclip className="h-5 w-5" />
          </button>
          {showAttachments && (
            <div
              className="absolute bottom-12 left-0 p-2 rounded-xl shadow-lg border space-y-1 z-20 min-w-[160px]"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-normal)",
              }}
            >
              <button
                onClick={() => {
                  setSpecialType("poll");
                  setShowAttachments(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                Poll
              </button>
              <button
                onClick={() => {
                  sendSpecialMessage("quiz", {
                    question: "Quick quiz!",
                    options: [
                      { text: "Option A", isCorrect: true },
                      { text: "Option B", isCorrect: false },
                    ],
                  });
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <HelpCircle className="h-4 w-4 text-amber-500" />
                Quiz
              </button>
              <button
                onClick={() => {
                  sendSpecialMessage("flashcard_share", {
                    deckTitle: "Shared Deck",
                    cardCount: 0,
                  });
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Layers className="h-4 w-4 text-purple-500" />
                Flashcards
              </button>
              <button
                onClick={() => {
                  sendSpecialMessage("pomodoro_invite", {
                    duration: 25,
                    status: "open",
                    participants: [],
                  });
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Timer className="h-4 w-4 text-cyan-500" />
                Pomodoro Invite
              </button>
            </div>
          )}
        </div>

        <div
          className="flex-1 rounded-2xl border overflow-hidden"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={disabled}
            className="w-full px-4 py-2.5 text-sm resize-none outline-none bg-transparent"
            style={{ color: "var(--text-primary)", maxHeight: 120 }}
          />
        </div>

        <Button
          size="sm"
          onClick={handleSend}
          disabled={
            disabled || (!text.trim() && specialType !== "poll")
          }
          className="rounded-xl h-10 w-10 p-0 bg-gradient-to-br from-cyan-500 to-teal-500"
        >
          <Send className="h-4 w-4 text-white" />
        </Button>
      </div>
    </div>
  );
}
