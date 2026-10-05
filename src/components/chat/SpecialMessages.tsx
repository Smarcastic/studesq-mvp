"use client";

import { Layers, Timer, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Flashcard share message
export function FlashcardShareMessage({ metadata }: { metadata: string }) {
  let data: { deckId?: string; deckTitle?: string; cardCount?: number; subject?: string };
  try {
    data = JSON.parse(metadata);
  } catch {
    return null;
  }

  return (
    <div
      className="p-4 rounded-2xl border max-w-xs"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg bg-purple-50">
          <Layers className="h-4 w-4 text-purple-500" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {data.deckTitle || "Flashcard Deck"}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {data.cardCount || 0} cards{data.subject ? ` · ${data.subject}` : ""}
          </p>
        </div>
      </div>
      {data.deckId && (
        <Link href={`/study/flashcards/${data.deckId}`}>
          <Button size="sm" variant="outline" className="w-full mt-2">
            Study this deck
          </Button>
        </Link>
      )}
    </div>
  );
}

// Pomodoro invite message
export function PomodoroInviteMessage({ metadata }: { metadata: string }) {
  let data: { duration?: number; subject?: string; status?: string; participants?: string[] };
  try {
    data = JSON.parse(metadata);
  } catch {
    return null;
  }

  return (
    <div
      className="p-4 rounded-2xl border max-w-xs"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg bg-cyan-50">
          <Timer className="h-4 w-4 text-cyan-500" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Pomodoro Session
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {data.duration || 25} min{data.subject ? ` · ${data.subject}` : ""}
          </p>
        </div>
      </div>
      <Link href="/study/timer">
        <Button size="sm" className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white">
          {data.status === "open" ? "Join Session" : "Start Timer"}
        </Button>
      </Link>
    </div>
  );
}

// Quiz message
export function QuizMessage({ metadata }: { metadata: string }) {
  let data: { question?: string; options?: { text: string; isCorrect: boolean }[]; explanation?: string };
  try {
    data = JSON.parse(metadata);
  } catch {
    return null;
  }

  return (
    <div
      className="p-4 rounded-2xl border max-w-sm"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {data.question || "Quiz Question"}
        </span>
      </div>
      <div className="space-y-1.5">
        {data.options?.map((opt, i) => (
          <div
            key={i}
            className="p-2 rounded-lg text-sm border"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            {opt.text}
          </div>
        ))}
      </div>
    </div>
  );
}
