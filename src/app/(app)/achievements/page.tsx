"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AchievementCard } from "@/components/achievements/achievement-card";
import { AchievementForm } from "@/components/achievements/achievement-form";
import { TrustScoreBadge } from "@/components/achievements/trust-score-badge";
import { categoryLabels, type AchievementInput } from "@/lib/validations/achievement";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Search, LayoutGrid, List, Trophy } from "lucide-react";

export default function AchievementsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("date-desc");
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: achievements, isLoading } = useQuery({
    queryKey: ["achievements", { category, search, sort }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (search) params.set("search", search);
      params.set("sort", sort);
      return fetch(`/api/achievements?${params}`).then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); });
    },
  });

  // Fetch user trust score
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetch("/api/profile").then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); }),
  });

  const createMutation = useMutation({
    mutationFn: (data: AchievementInput) =>
      fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create achievement");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast("Achievement added successfully!");
      setShowForm(false);
    },
    onError: () => toast("Failed to create achievement", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/achievements/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast("Achievement deleted");
    },
    onError: () => toast("Failed to delete achievement", "error"),
  });

  const requestReviewMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/achievements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_review" }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to request review");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      toast("Submitted for verification review");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Failed to request review", "error"),
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      fetch(`/api/achievements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_visibility", isPublic }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update visibility");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      toast("Visibility updated");
    },
    onError: () => toast("Failed to update visibility", "error"),
  });

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...Object.entries(categoryLabels).map(([value, label]) => ({ value, label })),
  ];

  const sortOptions = [
    { value: "date-desc", label: "Newest First" },
    { value: "date-asc", label: "Oldest First" },
    { value: "title-asc", label: "Title A-Z" },
    { value: "title-desc", label: "Title Z-A" },
  ];

  return (
    <div>
      <PageHeader
        title="Achievements"
        description="Track your milestones, awards, and accomplishments."
        action={
          <div className="flex items-center gap-3">
            {profile && (
              <TrustScoreBadge
                score={profile.trustScore ?? 0}
                verifiedCount={profile.verifiedAchievementsCount ?? 0}
              />
            )}
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Add Achievement
            </Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search achievements..."
            className="flex h-10 w-full rounded-lg border-2 bg-white dark:bg-dark-surface pl-10 pr-3 py-2 text-sm border-gray-300 dark:border-dark-border placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <Select
          options={categoryOptions}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full sm:w-44"
        />
        <Select
          options={sortOptions}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full sm:w-40"
        />
        <div className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-dark-surface">
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-md transition-colors ${view === "grid" ? "bg-white dark:bg-dark-border shadow-sm" : "hover:bg-white/50 dark:hover:bg-white/5"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 rounded-md transition-colors ${view === "list" ? "bg-white dark:bg-dark-border shadow-sm" : "hover:bg-white/50 dark:hover:bg-white/5"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className={view === "grid" ? "h-48" : "h-16"} />
          ))}
        </div>
      ) : achievements?.length > 0 ? (
        <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
          {achievements.map((a: Record<string, unknown> & { id: string }) => (
            <AchievementCard
              key={a.id}
              achievement={a as unknown as Parameters<typeof AchievementCard>[0]["achievement"]}
              view={view}
              onDelete={(id) => setDeleteTarget(id)}
              onRequestReview={(id) => requestReviewMutation.mutate(id)}
              onToggleVisibility={(id, isPublic) => toggleVisibilityMutation.mutate({ id, isPublic })}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Trophy className="h-12 w-12" />}
          title="No achievements yet"
          description="Start tracking your accomplishments by adding your first achievement."
          action={
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Add Achievement
            </Button>
          }
        />
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Achievement" size="lg">
        <AchievementForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
          saving={createMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        title="Delete achievement?"
        description="This will permanently remove this achievement. This action cannot be undone."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
