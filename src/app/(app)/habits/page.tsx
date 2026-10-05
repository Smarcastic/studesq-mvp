"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FadeUp } from "@/components/ui/motion";
import { motion } from "framer-motion";
import { Plus, Trash2, CheckCircle, Flame } from "lucide-react";
import { HabitInsights } from "@/components/habits/HabitInsights";

/* ---------- types ---------- */
interface HabitLog {
  id: string;
  date: string; // "YYYY-MM-DD"
  done: boolean;
}

interface Habit {
  id: string;
  title: string;
  emoji?: string;
  logs: HabitLog[];
  createdAt: string;
}

/* ---------- date helpers ---------- */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getLast7Days(): { date: string; label: string; isToday: boolean }[] {
  const days: { date: string; label: string; isToday: boolean }[] = [];
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      date: toISODate(d),
      label: dayLabels[d.getDay()],
      isToday: i === 0,
    });
  }

  return days;
}

function getStreak(logs: HabitLog[]): number {
  const doneSet = new Set(
    logs.filter((l) => l.done).map((l) => l.date)
  );
  let streak = 0;
  const d = new Date();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const key = toISODate(d);
    if (doneSet.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/* ---------- component ---------- */
export default function HabitsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newEmoji, setNewEmoji] = useState("");

  const last7 = useMemo(() => getLast7Days(), []);

  /* ---- queries ---- */
  const { data: habits, isLoading } = useQuery<Habit[]>({
    queryKey: ["habits"],
    queryFn: () =>
      fetch("/api/habits").then((r) => {
        if (!r.ok) throw new Error("Failed to fetch habits");
        return r.json();
      }),
  });

  /* ---- mutations ---- */
  const createMutation = useMutation({
    mutationFn: (body: { title: string; emoji?: string }) =>
      fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create habit");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast("Habit created!");
      closeModal();
    },
    onError: () => toast("Failed to create habit", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/habits/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast("Habit deleted");
    },
    onError: () => toast("Failed to delete habit", "error"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      fetch(`/api/habits/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to toggle");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
    onError: () => toast("Failed to update habit", "error"),
  });

  /* ---- helpers ---- */
  const closeModal = useCallback(() => {
    setShowModal(false);
    setNewTitle("");
    setNewEmoji("");
  }, []);

  const handleCreate = useCallback(() => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    createMutation.mutate({
      title: trimmed,
      emoji: newEmoji.trim() || undefined,
    });
  }, [newTitle, newEmoji, createMutation]);

  const isDone = useCallback(
    (logs: HabitLog[], dateStr: string) =>
      logs.some((l) => l.date === dateStr && l.done),
    []
  );

  /* ---------- render ---------- */
  return (
    <div>
      <PageHeader
        title="Habit Tracker"
        description="Build consistent daily habits to reach your goals."
        action={
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" /> Add Habit
          </Button>
        }
      />

      {/* day labels header */}
      {!isLoading && habits && habits.length > 0 && (
        <FadeUp>
          <div className="hidden sm:flex items-center justify-end gap-2 mb-3 pr-14">
            {last7.map((day) => (
              <span
                key={day.date}
                className={`w-9 text-center text-xs font-medium ${
                  day.isToday ? "text-cyan-600 font-semibold" : ""
                }`}
                style={!day.isToday ? { color: 'var(--text-muted)' } : undefined}
              >
                {day.label}
              </span>
            ))}
            {/* spacer for streak column */}
            <span className="w-16" />
          </div>
        </FadeUp>
      )}

      {/* loading state */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-[14px]" />
          ))}
        </div>
      ) : habits && habits.length > 0 ? (
        <div className="space-y-3">
          {habits.map((habit, idx) => {
            const streak = getStreak(habit.logs);

            return (
              <FadeUp key={habit.id} delay={idx * 0.05}>
                <Card padding="none" className="group relative">
                  <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">
                    {/* emoji */}
                    <span className="text-xl leading-none select-none shrink-0">
                      {habit.emoji || "\u2705"}
                    </span>

                    {/* title */}
                    <span className="text-sm font-medium truncate min-w-0 flex-1" style={{ color: 'var(--text-primary)' }}>
                      {habit.title}
                    </span>

                    {/* day circles */}
                    <div className="flex items-center gap-2 shrink-0">
                      {last7.map((day) => {
                        const done = isDone(habit.logs, day.date);
                        return (
                          <motion.button
                            key={day.date}
                            type="button"
                            whileTap={{ scale: 0.85 }}
                            whileHover={{ scale: 1.15 }}
                            onClick={() =>
                              toggleMutation.mutate({
                                id: habit.id,
                                date: day.date,
                              })
                            }
                            className={`
                              w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium
                              transition-colors duration-150 cursor-pointer
                              ${
                                done
                                  ? "bg-cyan-500 text-white shadow-sm shadow-cyan-500/25"
                                  : day.isToday
                                  ? "border-2 border-cyan-300 bg-cyan-50 text-cyan-600"
                                  : ""
                              }
                            `}
                            style={!done && !day.isToday ? { background: 'var(--bg-card)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' } : undefined}
                            title={`${day.label} ${day.date}`}
                          >
                            {done ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <span className="sm:hidden">{day.label.charAt(0)}</span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* streak */}
                    <div
                      className="flex items-center gap-1 shrink-0 w-16 justify-end"
                      title={`${streak} day streak`}
                    >
                      {streak > 0 && (
                        <>
                          <Flame className="h-4 w-4 text-orange-400" />
                          <span className="text-sm font-semibold text-orange-500">
                            {streak}
                          </span>
                        </>
                      )}
                    </div>

                    {/* delete button */}
                    <button
                      onClick={() => setDeleteTarget(habit.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all duration-150 shrink-0"
                      style={{ color: 'var(--text-muted)' }}
                      title="Delete habit"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              </FadeUp>
            );
          })}
        </div>
      ) : (
        <FadeUp>
          <EmptyState
            icon={<CheckCircle className="h-12 w-12" />}
            title="No habits yet"
            description="Start building good habits by adding your first one."
            action={
              <Button size="sm" onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4" /> Add Habit
              </Button>
            }
          />
        </FadeUp>
      )}

      {/* Habit Insights */}
      {habits && habits.length > 0 && <HabitInsights habits={habits} />}

      {/* add habit modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title="Add New Habit"
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
          className="space-y-4"
        >
          <Input
            id="habit-title"
            label="Habit Title"
            placeholder="e.g., Read for 30 minutes"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <Input
            id="habit-emoji"
            label="Emoji (optional)"
            placeholder="\u2705"
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            maxLength={4}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending}
              disabled={!newTitle.trim()}
            >
              Add Habit
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        title="Delete habit?"
        description="This will permanently remove this habit and all its history. This action cannot be undone."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
