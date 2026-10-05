"use client";

import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  remaining: number;
  progress: number;
  isCountdown: boolean;
  isRunning: boolean;
  isComplete: boolean;
}

export function TimerDisplay({ remaining, progress, isCountdown, isRunning, isComplete }: TimerDisplayProps) {
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // SVG circular progress
  const size = 280;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = isCountdown ? circumference * (1 - progress) : 0;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-dark-border"
        />
        {/* Progress circle */}
        {isCountdown && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#timerGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-300"
          />
        )}
        <defs>
          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-primary-400)" />
            <stop offset="100%" stopColor="var(--color-secondary-500)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-mono text-5xl font-bold tracking-wider tabular-nums",
            isComplete && "text-success",
            isRunning && "text-primary-500"
          )}
        >
          {timeStr}
        </span>
        {isComplete && (
          <span className="text-sm text-success mt-2 font-medium">Session Complete!</span>
        )}
      </div>
    </div>
  );
}
