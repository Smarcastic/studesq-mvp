"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FadeUp, StaggerList, StaggerItem } from "@/components/ui/motion";
import {
  CalendarClock,
  Plus,
  Trash2,
  MapPin,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  StickyNote,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

interface Topic {
  id: string;
  topic: string;
  isComplete: boolean;
}

interface Exam {
  id: string;
  subject: string;
  date: string;
  location?: string | null;
  notes?: string | null;
  color?: string | null;
  topics: Topic[];
  createdAt: string;
}

// ── Schema ─────────────────────────────────────────────────────

const COLOR_PRESETS = ["#06b6d4", "#f59e0b", "#10b981", "#8b5cf6", "#f43f5e", "#3b82f6"] as const;

const examSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(120),
  date: z.string().min(1, "Date is required"),
  location: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  color: z.string().optional(),
});

type ExamInput = z.infer<typeof examSchema>;

// ── Helpers ────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  // Reset hours so we compare full days only
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function countdownLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 0) return `${Math.abs(days)} days ago`;
  return `${days} days left`;
}

function countdownColor(days: number): string {
  if (days < 0) return "text-slate-400";
  if (days < 3) return "text-red-500";
  if (days <= 7) return "text-amber-500";
  return "text-emerald-500";
}

function formatExamDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Component ──────────────────────────────────────────────────

export default function ExamsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [addingTopicFor, setAddingTopicFor] = useState<string | null>(null);
  const [newTopicText, setNewTopicText] = useState("");

  // ── Queries ────────────────────────────────────────────────

  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ["exams"],
    queryFn: () => fetch("/api/exams").then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); }),
  });

  // ── Mutations ──────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: ExamInput) =>
      fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          date: new Date(data.date).toISOString(),
        }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create exam");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      toast("Exam added!");
      setShowForm(false);
      reset();
    },
    onError: () => toast("Failed to create exam", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/exams/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      toast("Exam deleted");
    },
    onError: () => toast("Failed to delete exam", "error"),
  });

  const toggleTopicMutation = useMutation({
    mutationFn: ({
      examId,
      topicId,
      isComplete,
    }: {
      examId: string;
      topicId: string;
      isComplete: boolean;
    }) =>
      fetch(`/api/exams/${examId}/topics/${topicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isComplete }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update topic");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
    onError: () => toast("Failed to update topic", "error"),
  });

  const addTopicMutation = useMutation({
    mutationFn: ({ examId, topic }: { examId: string; topic: string }) =>
      fetch(`/api/exams/${examId}/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to add topic");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      setNewTopicText("");
      setAddingTopicFor(null);
      toast("Topic added!");
    },
    onError: () => toast("Failed to add topic", "error"),
  });

  // ── Form ───────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExamInput>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      subject: "",
      date: "",
      location: "",
      notes: "",
      color: COLOR_PRESETS[0],
    },
  });

  const selectedColor = watch("color");

  // ── Derived data ───────────────────────────────────────────

  const { upcoming, past } = useMemo(() => {
    if (!exams) return { upcoming: [], past: [] };
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const sorted = [...exams].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const upcoming: Exam[] = [];
    const past: Exam[] = [];

    for (const exam of sorted) {
      const examDate = new Date(exam.date);
      examDate.setHours(0, 0, 0, 0);
      if (examDate.getTime() >= now.getTime()) {
        upcoming.push(exam);
      } else {
        past.push(exam);
      }
    }

    // Past exams: most recent first
    past.reverse();

    return { upcoming, past };
  }, [exams]);

  // ── Handlers ───────────────────────────────────────────────

  const handleAddTopic = (examId: string) => {
    const trimmed = newTopicText.trim();
    if (!trimmed) return;
    addTopicMutation.mutate({ examId, topic: trimmed });
  };

  // ── Exam Card ──────────────────────────────────────────────

  function ExamCard({ exam, muted = false }: { exam: Exam; muted?: boolean }) {
    const days = daysUntil(exam.date);
    const completedTopics = exam.topics.filter((t) => t.isComplete).length;
    const totalTopics = exam.topics.length;
    const progressPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    const barColor = exam.color || "#06b6d4";

    return (
      <Card padding="none" className={`relative group overflow-hidden ${muted ? "opacity-60" : ""}`}>
        {/* Color indicator bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-[14px]"
          style={{ backgroundColor: barColor }}
        />

        <div className="pl-5 pr-5 py-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-slate-900 truncate">
                {exam.subject}
              </h3>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-sm text-slate-500">
                  {formatExamDate(exam.date)}
                </span>
                <Badge
                  variant={
                    days < 0
                      ? "default"
                      : days < 3
                        ? "error"
                        : days <= 7
                          ? "warning"
                          : "success"
                  }
                >
                  <span className={countdownColor(days)}>
                    {countdownLabel(days)}
                  </span>
                </Badge>
              </div>
            </div>

            {/* Delete button (on hover) */}
            <button
              onClick={() => setDeleteTarget(exam.id)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
              title="Delete exam"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Location */}
          {exam.location && (
            <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{exam.location}</span>
            </div>
          )}

          {/* Notes */}
          {exam.notes && (
            <div className="flex items-start gap-1.5 mt-2 text-sm text-slate-400">
              <StickyNote className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{exam.notes}</span>
            </div>
          )}

          {/* Revision Topics */}
          {(totalTopics > 0 || !muted) && (
            <div className="mt-4">
              {totalTopics > 0 && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Revision Topics
                    </span>
                    <span className="text-xs text-slate-400">
                      {completedTopics}/{totalTopics} completed
                    </span>
                  </div>
                  <Progress
                    value={progressPct}
                    size="sm"
                    color={progressPct === 100 ? "success" : "primary"}
                    className="mb-3"
                  />
                  <div className="space-y-1">
                    {exam.topics.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() =>
                          toggleTopicMutation.mutate({
                            examId: exam.id,
                            topicId: topic.id,
                            isComplete: !topic.isComplete,
                          })
                        }
                        className="flex items-center gap-2 w-full text-left py-1 px-1 -mx-1 rounded-lg hover:bg-slate-50 transition-colors group/topic"
                      >
                        {topic.isComplete ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-300 group-hover/topic:text-slate-400 shrink-0" />
                        )}
                        <span
                          className={`text-sm ${
                            topic.isComplete
                              ? "line-through text-slate-400"
                              : "text-slate-700"
                          }`}
                        >
                          {topic.topic}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Add topic inline */}
              {!muted && (
                <div className="mt-2">
                  {addingTopicFor === exam.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newTopicText}
                        onChange={(e) => setNewTopicText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTopic(exam.id);
                          }
                          if (e.key === "Escape") {
                            setAddingTopicFor(null);
                            setNewTopicText("");
                          }
                        }}
                        placeholder="Topic name..."
                        autoFocus
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddTopic(exam.id)}
                        loading={addTopicMutation.isPending}
                        disabled={!newTopicText.trim()}
                      >
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setAddingTopicFor(null);
                          setNewTopicText("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingTopicFor(exam.id);
                        setNewTopicText("");
                      }}
                      className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-cyan-600 transition-colors py-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add topic
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Exam Countdown"
        description="Track your upcoming exams and revision progress."
        action={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Add Exam
          </Button>
        }
      />

      {isLoading ? (
        <FadeUp>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-[14px]" />
            ))}
          </div>
        </FadeUp>
      ) : exams && exams.length > 0 ? (
        <>
          {/* Upcoming Exams */}
          {upcoming.length > 0 ? (
            <FadeUp>
              <StaggerList className="space-y-4">
                {upcoming.map((exam) => (
                  <StaggerItem key={exam.id}>
                    <ExamCard exam={exam} />
                  </StaggerItem>
                ))}
              </StaggerList>
            </FadeUp>
          ) : (
            <FadeUp>
              <Card>
                <div className="flex flex-col items-center py-8 gap-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  <p className="text-slate-500 text-sm">
                    No upcoming exams. You&apos;re all caught up!
                  </p>
                </div>
              </Card>
            </FadeUp>
          )}

          {/* Past Exams */}
          {past.length > 0 && (
            <FadeUp delay={0.1}>
              <div className="mt-8">
                <button
                  onClick={() => setShowPast(!showPast)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors mb-4"
                >
                  {showPast ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  Past Exams ({past.length})
                </button>
                {showPast && (
                  <div className="space-y-3">
                    {past.map((exam) => (
                      <ExamCard key={exam.id} exam={exam} muted />
                    ))}
                  </div>
                )}
              </div>
            </FadeUp>
          )}
        </>
      ) : (
        <FadeUp>
          <EmptyState
            icon={<CalendarClock className="h-12 w-12" />}
            title="No exams yet"
            description="Add your upcoming exams to start tracking countdowns and revision topics."
            action={
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" /> Add Exam
              </Button>
            }
          />
        </FadeUp>
      )}

      {/* ── Add Exam Modal ─────────────────────────────────── */}
      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          reset();
        }}
        title="Add Exam"
        size="md"
      >
        <form
          onSubmit={handleSubmit((data) => createMutation.mutate(data))}
          className="space-y-4"
        >
          <Input
            id="exam-subject"
            label="Subject"
            placeholder="e.g., Calculus II, Organic Chemistry"
            {...register("subject")}
            error={errors.subject?.message}
          />

          <Input
            id="exam-date"
            label="Exam Date"
            type="date"
            {...register("date")}
            error={errors.date?.message}
          />

          <Input
            id="exam-location"
            label="Location (optional)"
            placeholder="e.g., Room 204, Science Building"
            {...register("location")}
          />

          {/* Color Picker */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Color
            </label>
            <div className="flex items-center gap-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue("color", color)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    selectedColor === color
                      ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <Textarea
            id="exam-notes"
            label="Notes (optional)"
            placeholder="Any additional notes about this exam..."
            rows={3}
            {...register("notes")}
          />

          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Add Exam
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        title="Delete exam?"
        description="This will permanently remove this exam and its revision topics. This action cannot be undone."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
