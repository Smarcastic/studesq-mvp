"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { goalSchema, goalCategoryLabels, goalCategoryColors, type GoalInput } from "@/lib/validations/goal";
import { formatDate } from "@/lib/utils";
import { Plus, Target, Trash2, CheckCircle2, Trophy, Calendar } from "lucide-react";

interface Milestone {
  title: string;
  completed: boolean;
}

interface GoalData {
  id: string;
  title: string;
  description?: string;
  category?: string;
  targetDate?: string;
  progress: number;
  status: string;
  milestones?: string;
  completedAt?: string;
  createdAt: string;
}

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("active");
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: goals, isLoading } = useQuery<GoalData[]>({
    queryKey: ["goals", statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      return fetch(`/api/goals?${params}`).then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "academic",
      targetDate: "",
      progress: 0,
      status: "active",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: GoalInput) =>
      fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast("Goal created!");
      setShowForm(false);
      reset();
    },
    onError: () => toast("Failed to create goal", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GoalInput & { milestones: Milestone[] }> }) =>
      fetch(`/api/goals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/goals/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast("Goal deleted");
    },
    onError: () => toast("Failed to delete goal", "error"),
  });

  const toggleMilestone = (goal: GoalData, milestoneIdx: number) => {
    let milestones: Milestone[] = [];
    try { milestones = goal.milestones ? JSON.parse(goal.milestones) : []; } catch { /* corrupted */ }
    if (!milestones[milestoneIdx]) return;
    milestones[milestoneIdx].completed = !milestones[milestoneIdx].completed;
    const completedCount = milestones.filter((m) => m.completed).length;
    const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;
    updateMutation.mutate({ id: goal.id, data: { milestones, progress } });
  };

  const completeGoal = (id: string) => {
    updateMutation.mutate({ id, data: { status: "completed", progress: 100 } });
    toast("Goal completed!");
  };

  const tabs = [
    { id: "active", label: "Active" },
    { id: "completed", label: "Completed" },
    { id: "all", label: "All" },
  ];

  const categoryOptions = [
    { value: "academic", label: "Academic" },
    { value: "extracurricular", label: "Extracurricular" },
    { value: "personal", label: "Personal" },
  ];

  return (
    <div>
      <PageHeader
        title="Goals"
        description="Set and track your personal and academic goals."
        action={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> New Goal
          </Button>
        }
      />

      <Tabs tabs={tabs} activeTab={statusFilter} onChange={setStatusFilter} className="mb-6" />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : goals && goals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goals.map((goal) => {
            let milestones: Milestone[] = [];
            try { milestones = goal.milestones ? JSON.parse(goal.milestones) : []; } catch { /* corrupted */ }
            return (
              <Card key={goal.id} className="relative group">
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {goal.status !== "completed" && (
                    <button
                      onClick={() => completeGoal(goal.id)}
                      className="p-1 rounded-lg hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      title="Mark as complete"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteTarget(goal.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${goal.status === "completed" ? "bg-emerald-50" : "bg-cyan-50"}`}>
                    {goal.status === "completed" ? (
                      <Trophy className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Target className="h-5 w-5 text-cyan-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <h3 className={`font-semibold ${goal.status === "completed" ? "text-slate-400 line-through" : ""}`}>
                      {goal.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {goal.category && (
                        <Badge variant={goalCategoryColors[goal.category] || "default"}>
                          {goalCategoryLabels[goal.category] || goal.category}
                        </Badge>
                      )}
                      {goal.targetDate && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formatDate(goal.targetDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {goal.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {goal.description}
                  </p>
                )}

                <Progress value={goal.progress} showLabel color={goal.status === "completed" ? "success" : "primary"} className="mb-3" />

                {milestones.length > 0 && (
                  <div className="space-y-1.5">
                    {milestones.map((m, idx) => (
                      <label key={idx} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={m.completed}
                          onChange={() => toggleMilestone(goal, idx)}
                          className="rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                        />
                        <span className={`text-sm ${m.completed ? "line-through text-slate-400" : ""}`}>
                          {m.title}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Target className="h-12 w-12" />}
          title={statusFilter === "active" ? "No active goals" : "No goals yet"}
          description="Set goals to track your progress and stay motivated."
          action={
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> New Goal
            </Button>
          }
        />
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); reset(); }} title="New Goal" size="lg">
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          <Input
            id="goal-title"
            label="Goal Title"
            placeholder="e.g., Maintain 3.5+ GPA this semester"
            {...register("title")}
            error={errors.title?.message}
          />
          <Textarea
            id="goal-desc"
            label="Description (optional)"
            placeholder="Why is this goal important to you?"
            {...register("description")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="goal-category"
              label="Category"
              options={categoryOptions}
              {...register("category")}
            />
            <Input
              id="goal-date"
              label="Target Date"
              type="date"
              {...register("targetDate")}
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create Goal</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        title="Delete goal?"
        description="This will permanently remove this goal and its milestones. This action cannot be undone."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
