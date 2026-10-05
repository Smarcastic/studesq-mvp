"use client";

import { BarChart3 } from "lucide-react";

interface PollOption {
  text: string;
  votes: string[];
}

interface PollData {
  question: string;
  options: PollOption[];
}

interface PollMessageProps {
  metadata: string;
  userId: string;
  onVote: (optionIndex: number) => void;
}

export function PollMessage({ metadata, userId, onVote }: PollMessageProps) {
  let data: PollData;
  try {
    data = JSON.parse(metadata);
  } catch {
    return <div className="text-sm text-red-500">Invalid poll data</div>;
  }

  const totalVotes = data.options.reduce((sum, o) => sum + o.votes.length, 0);
  const hasVoted = data.options.some((o) => o.votes.includes(userId));

  return (
    <div
      className="p-4 rounded-2xl border max-w-sm"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-indigo-500" />
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {data.question}
        </span>
      </div>
      <div className="space-y-2">
        {data.options.map((option, i) => {
          const pct = totalVotes > 0 ? (option.votes.length / totalVotes) * 100 : 0;
          const voted = option.votes.includes(userId);

          return (
            <button
              key={i}
              onClick={() => onVote(i)}
              className={`w-full text-left p-2.5 rounded-xl border text-sm relative overflow-hidden transition-all ${
                voted ? "border-cyan-300" : ""
              }`}
              style={{
                borderColor: voted ? undefined : "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            >
              {hasVoted && (
                <div
                  className="absolute inset-0 rounded-xl transition-all"
                  style={{
                    width: `${pct}%`,
                    background: voted
                      ? "rgba(6, 182, 212, 0.15)"
                      : "var(--bg-elevated)",
                  }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <span>{option.text}</span>
                {hasVoted && (
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    {Math.round(pct)}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
