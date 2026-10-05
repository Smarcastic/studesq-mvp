"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Clock, Zap } from "lucide-react";
import { type Theme } from "./themes";

interface StatsBarProps {
  theme: Theme;
  todayMinutes: number;
  todaySessions: number;
  streak?: number;
  weeklyData?: number[]; // 7 values (Mon–Sun minutes), optional
}

export function StatsBar({
  theme,
  todayMinutes,
  todaySessions,
  streak = 0,
  weeklyData,
}: StatsBarProps) {
  const isMinimal = theme.id === "minimal";

  const hours = Math.floor(todayMinutes / 60);
  const mins = todayMinutes % 60;
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="flex items-center justify-center"
    >
      <div
        className="inline-flex items-center gap-4 px-5 py-2.5 rounded-2xl"
        style={{
          background: isMinimal
            ? "rgba(0,0,0,0.03)"
            : "rgba(255,255,255,0.05)",
          border: `1px solid ${theme.surfaceBorder}`,
          backdropFilter: "blur(8px)",
        }}
      >
        <AnimatedStatChip
          icon={<Clock className="h-3 w-3" />}
          label="Today"
          value={timeStr}
          theme={theme}
        />
        <Divider theme={theme} />
        <AnimatedStatChip
          icon={<Zap className="h-3 w-3" />}
          label="Sessions"
          value={String(todaySessions)}
          theme={theme}
          animateNumber
          numericValue={todaySessions}
        />
        {streak > 0 && (
          <>
            <Divider theme={theme} />
            <AnimatedStatChip
              icon={<Flame className="h-3 w-3" style={{ color: "#fb923c" }} />}
              label="Streak"
              value={`${streak}d`}
              theme={theme}
              highlight
              animateNumber
              numericValue={streak}
            />
          </>
        )}
        {/* Mini weekly graph */}
        {weeklyData && weeklyData.length === 7 && (
          <>
            <Divider theme={theme} />
            <MiniWeekGraph data={weeklyData} theme={theme} />
          </>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Animated stat chip — counts up on mount or value change.
 */
function AnimatedStatChip({
  icon,
  label,
  value,
  theme,
  highlight,
  animateNumber,
  numericValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  theme: Theme;
  highlight?: boolean;
  animateNumber?: boolean;
  numericValue?: number;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(numericValue ?? 0);

  useEffect(() => {
    if (!animateNumber || numericValue === undefined) {
      setDisplayValue(value);
      return;
    }

    const from = prevValueRef.current;
    const to = numericValue;
    prevValueRef.current = to;

    if (from === to) {
      setDisplayValue(value);
      return;
    }

    // Animate from -> to over 600ms
    const start = performance.now();
    const duration = 600;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);

      // Reconstruct display with suffix
      const suffix = value.replace(/\d+/, "");
      setDisplayValue(`${current}${suffix}`);

      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value, numericValue, animateNumber]);

  return (
    <div className="flex items-center gap-1.5">
      <span style={{ color: highlight ? "#fb923c" : theme.mutedText }}>
        {icon}
      </span>
      <div className="flex items-baseline gap-1">
        <motion.span
          key={displayValue}
          initial={{ y: -2, opacity: 0.7 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="text-xs font-semibold tabular"
          style={{
            color: theme.textColor,
            opacity: 0.9,
          }}
        >
          {displayValue}
        </motion.span>
        <span className="text-[10px]" style={{ color: theme.mutedText }}>
          {label}
        </span>
      </div>
    </div>
  );
}

/**
 * Mini bar chart showing weekly study data.
 * 7 bars, each proportional to max value.
 */
function MiniWeekGraph({
  data,
  theme,
}: {
  data: number[];
  theme: Theme;
}) {
  const isMinimal = theme.id === "minimal";
  const maxVal = useMemo(() => Math.max(...data, 1), [data]);
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date().getDay(); // 0=Sun, 1=Mon
  const todayIndex = today === 0 ? 6 : today - 1; // Mon=0 ... Sun=6

  return (
    <div className="flex items-end gap-[3px] h-[28px]">
      {data.map((val, i) => {
        const height = Math.max(2, (val / maxVal) * 22);
        const isToday = i === todayIndex;
        return (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height }}
              transition={{ delay: 0.6 + i * 0.05, duration: 0.4, ease: "easeOut" }}
              className="rounded-sm"
              style={{
                width: 4,
                background: isToday
                  ? theme.ringColor
                  : isMinimal
                    ? "rgba(0,0,0,0.12)"
                    : "rgba(255,255,255,0.15)",
                boxShadow: isToday ? `0 0 4px ${theme.glowColor}` : "none",
              }}
            />
            <span
              className="text-[7px] leading-none"
              style={{
                color: isToday ? theme.ringColor : theme.mutedText,
                fontWeight: isToday ? 700 : 400,
              }}
            >
              {days[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Divider({ theme }: { theme: Theme }) {
  return (
    <div
      className="w-px h-4"
      style={{
        background:
          theme.id === "minimal"
            ? "rgba(0,0,0,0.08)"
            : "rgba(255,255,255,0.08)",
      }}
    />
  );
}
