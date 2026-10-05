"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2, Calendar, Flame, BarChart3, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { FadeUp, StaggerList, StaggerItem } from "@/components/ui/motion";
import { Textarea } from "@/components/ui/textarea";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Mood = "THRIVING" | "GOOD" | "OKAY" | "STRUGGLING" | "BURNT_OUT";

interface MoodEntry {
  id: string;
  mood: Mood;
  note?: string | null;
  date: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MOODS: { value: Mood; emoji: string; label: string; color: string; dotColor: string; barColor: string }[] = [
  { value: "THRIVING",    emoji: "\u{1F680}", label: "Thriving",    color: "bg-emerald-50 border-emerald-200 text-emerald-700", dotColor: "bg-emerald-400", barColor: "bg-emerald-400" },
  { value: "GOOD",        emoji: "\u{1F33B}", label: "Good",        color: "bg-teal-50 border-teal-200 text-teal-700",         dotColor: "bg-teal-400",    barColor: "bg-teal-400" },
  { value: "OKAY",        emoji: "\u{1F610}", label: "Okay",        color: "bg-amber-50 border-amber-200 text-amber-700",      dotColor: "bg-amber-400",   barColor: "bg-amber-400" },
  { value: "STRUGGLING",  emoji: "\u2601\uFE0F",  label: "Struggling",  color: "bg-orange-50 border-orange-200 text-orange-700",  dotColor: "bg-orange-400",  barColor: "bg-orange-400" },
  { value: "BURNT_OUT",   emoji: "\u{1F525}", label: "Burnt Out",   color: "bg-red-50 border-red-200 text-red-700",            dotColor: "bg-red-400",     barColor: "bg-red-400" },
];

const moodMeta = (mood: Mood) => MOODS.find((m) => m.value === mood)!;

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
async function fetchEntries(): Promise<MoodEntry[]> {
  const res = await fetch("/api/wellness?limit=30");
  if (!res.ok) throw new Error("Failed to load wellness entries");
  return res.json();
}

async function createEntry(data: { mood: Mood; note?: string }): Promise<MoodEntry> {
  const res = await fetch("/api/wellness", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save check-in");
  return res.json();
}

async function deleteEntry(id: string): Promise<void> {
  const res = await fetch(`/api/wellness/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete entry");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function WellnessPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [note, setNote] = useState("");

  // --- Queries & Mutations --------------------------------------------------
  const { data: entries = [], isLoading } = useQuery<MoodEntry[]>({
    queryKey: ["wellness"],
    queryFn: fetchEntries,
  });

  const saveMutation = useMutation({
    mutationFn: createEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wellness"] });
      setSelectedMood(null);
      setNote("");
      toast("Check-in saved!", "success");
    },
    onError: () => toast("Could not save check-in", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wellness"] });
      toast("Entry deleted", "success");
    },
    onError: () => toast("Could not delete entry", "error"),
  });

  // --- Derived data ---------------------------------------------------------
  const todayEntry = useMemo(() => entries.find((e) => isToday(e.date)), [entries]);

  const streak = useMemo(() => {
    if (entries.length === 0) return 0;
    let count = 0;
    const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = 0; i < sorted.length; i++) {
      const entryDate = new Date(sorted[i].date);
      entryDate.setHours(0, 0, 0, 0);
      const expected = new Date(now);
      expected.setDate(expected.getDate() - i);

      if (entryDate.getTime() === expected.getTime()) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [entries]);

  const weeklySummary = useMemo(() => {
    const last7 = entries.filter((e) => {
      const diff = (Date.now() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    });
    const counts: Record<Mood, number> = {
      THRIVING: 0,
      GOOD: 0,
      OKAY: 0,
      STRUGGLING: 0,
      BURNT_OUT: 0,
    };
    last7.forEach((e) => counts[e.mood]++);
    return counts;
  }, [entries]);

  const last30Dots = useMemo(() => {
    const dots: { date: Date; mood: Mood | null }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const entry = entries.find((e) => {
        const ed = new Date(e.date);
        return (
          ed.getFullYear() === d.getFullYear() &&
          ed.getMonth() === d.getMonth() &&
          ed.getDate() === d.getDate()
        );
      });
      dots.push({ date: d, mood: entry?.mood ?? null });
    }
    return dots;
  }, [entries]);

  // --- Handlers -------------------------------------------------------------
  function handleSave() {
    if (!selectedMood) return;
    saveMutation.mutate({ mood: selectedMood, note: note.trim() || undefined });
  }

  // --- Render ---------------------------------------------------------------
  return (
    <div>
      <PageHeader
        title="Wellness Check-in"
        description="Track your mood and build healthy habits."
      />

      <div className="space-y-6">
        {/* ============================================================== */}
        {/* TODAY'S CHECK-IN                                               */}
        {/* ============================================================== */}
        <FadeUp>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-cyan-500" />
              <CardTitle>How are you feeling today?</CardTitle>
            </div>

            {isLoading ? (
              <div className="flex gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : todayEntry ? (
              /* Already checked in */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2 py-6"
              >
                <span className="text-5xl">{moodMeta(todayEntry.mood).emoji}</span>
                <p className="text-lg font-semibold text-slate-800">
                  {moodMeta(todayEntry.mood).label}
                </p>
                <Badge variant="teal">Already checked in today</Badge>
                {todayEntry.note && (
                  <p className="text-sm text-slate-500 mt-2 text-center max-w-md">
                    &ldquo;{todayEntry.note}&rdquo;
                  </p>
                )}
              </motion.div>
            ) : (
              /* Mood selector */
              <>
                <div className="grid grid-cols-5 gap-3">
                  {MOODS.map((m) => (
                    <motion.button
                      key={m.value}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedMood(m.value)}
                      className={`
                        flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-xl border-2 transition-all cursor-pointer
                        ${
                          selectedMood === m.value
                            ? `${m.color} border-current shadow-md ring-2 ring-offset-2 ring-cyan-400/30`
                            : "bg-white border-slate-100 hover:border-slate-200 text-slate-600"
                        }
                      `}
                    >
                      <span className="text-3xl">{m.emoji}</span>
                      <span className="text-xs font-medium leading-tight text-center">
                        {m.label}
                      </span>
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence>
                  {selectedMood && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 space-y-3">
                        <Textarea
                          placeholder="Add an optional note about how you're feeling..."
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={3}
                        />
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => {
                              setSelectedMood(null);
                              setNote("");
                            }}
                            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            Cancel
                          </button>
                          <Button
                            onClick={handleSave}
                            loading={saveMutation.isPending}
                          >
                            Save Check-in
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </Card>
        </FadeUp>

        {/* ============================================================== */}
        {/* STATS ROW: Streak + Weekly Summary                             */}
        {/* ============================================================== */}
        <FadeUp delay={0.1}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Streak */}
            <Card>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-orange-50">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-7 w-24" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-900">
                      {streak} day{streak !== 1 ? "s" : ""}
                    </p>
                  )}
                  <p className="text-sm text-slate-500">Check-in streak</p>
                </div>
              </div>
            </Card>

            {/* Weekly summary */}
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-cyan-500" />
                <p className="text-sm font-medium text-slate-700">This Week</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="flex items-end gap-1.5 h-12">
                  {MOODS.map((m) => {
                    const count = weeklySummary[m.value];
                    const maxCount = Math.max(...Object.values(weeklySummary), 1);
                    const heightPct = count > 0 ? Math.max((count / maxCount) * 100, 12) : 4;
                    return (
                      <div key={m.value} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-t-sm transition-all ${count > 0 ? m.barColor : "bg-slate-100"}`}
                          style={{ height: `${heightPct}%` }}
                          title={`${m.label}: ${count}`}
                        />
                        <span className="text-[10px] text-slate-400">{m.emoji}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </FadeUp>

        {/* ============================================================== */}
        {/* 30-DAY MOOD GRID                                               */}
        {/* ============================================================== */}
        <FadeUp delay={0.15}>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-cyan-500" />
              <CardTitle className="text-base">Last 30 Days</CardTitle>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-10 gap-2">
                {Array.from({ length: 30 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-4 rounded-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-10 gap-2">
                  {last30Dots.map((dot, i) => (
                    <div
                      key={i}
                      title={`${dot.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}${dot.mood ? ` — ${moodMeta(dot.mood).label}` : ""}`}
                      className={`h-4 w-4 rounded-full transition-colors ${
                        dot.mood ? moodMeta(dot.mood).dotColor : "bg-slate-100"
                      }`}
                    />
                  ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-50">
                  {MOODS.map((m) => (
                    <div key={m.value} className="flex items-center gap-1.5">
                      <div className={`h-2.5 w-2.5 rounded-full ${m.dotColor}`} />
                      <span className="text-xs text-slate-400">{m.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </FadeUp>

        {/* ============================================================== */}
        {/* RECENT ENTRIES                                                 */}
        {/* ============================================================== */}
        <FadeUp delay={0.2}>
          <Card padding="none">
            <div className="px-5 pt-5 pb-3 flex items-center gap-2">
              <Heart className="h-4 w-4 text-cyan-500" />
              <CardTitle className="text-base">Recent Entries</CardTitle>
            </div>

            {isLoading ? (
              <div className="px-5 pb-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <EmptyState
                icon={<Heart className="h-12 w-12" />}
                title="No check-ins yet"
                description="Start tracking your wellness by checking in above."
              />
            ) : (
              <StaggerList className="divide-y divide-slate-50">
                {entries.map((entry) => {
                  const meta = moodMeta(entry.mood);
                  return (
                    <StaggerItem key={entry.id}>
                      <div className="flex items-start gap-3 px-5 py-3.5 group">
                        {/* Emoji */}
                        <span className="text-2xl mt-0.5 shrink-0">{meta.emoji}</span>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800">
                              {meta.label}
                            </span>
                            <Badge
                              variant={
                                entry.mood === "THRIVING"
                                  ? "success"
                                  : entry.mood === "GOOD"
                                  ? "teal"
                                  : entry.mood === "OKAY"
                                  ? "warning"
                                  : entry.mood === "STRUGGLING"
                                  ? "warning"
                                  : "error"
                              }
                            >
                              {formatDate(entry.date)}
                            </Badge>
                          </div>
                          {entry.note && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                              {entry.note}
                            </p>
                          )}
                        </div>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(entry.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500 transition-colors" />
                        </Button>
                      </div>
                    </StaggerItem>
                  );
                })}
              </StaggerList>
            )}
          </Card>
        </FadeUp>
      </div>
    </div>
  );
}
