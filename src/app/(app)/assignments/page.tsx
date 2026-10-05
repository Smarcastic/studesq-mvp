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
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { assignmentSchema, statusLabels, type AssignmentInput } from "@/lib/validations/assignment";
import { formatDate } from "@/lib/utils";
import { Plus, ClipboardList, Calendar, CheckCircle2, Circle, Clock, Trash2, Pencil, ArrowUpDown } from "lucide-react";

type SortKey = "created" | "dueDate" | "priority";

interface AssignmentData {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  dueDate?: string;
  priority: string;
  status: string;
  createdAt: string;
}

const priorityBadgeVariant: Record<string, "default" | "info" | "warning" | "error"> = {
  low: "default",
  medium: "info",
  high: "warning",
  urgent: "error",
};

const statusIcon: Record<string, React.ReactNode> = {
  todo: <Circle className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />,
  in_progress: <Clock className="h-4 w-4 text-blue-500" />,
  done: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
};

export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("created");
  const [editTarget, setEditTarget] = useState<AssignmentData | null>(null);

  const { data: assignments, isLoading } = useQuery<AssignmentData[]>({
    queryKey: ["assignments", statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      return fetch(`/api/assignments?${params}`).then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignmentInput>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      dueDate: "",
      priority: "medium",
      status: "todo",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: AssignmentInput) =>
      fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Assignment created!");
      setShowForm(false);
      reset();
    },
    onError: () => toast("Failed to create assignment", "error"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/assignments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/assignments/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Assignment deleted");
    },
    onError: () => toast("Failed to delete assignment", "error"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignmentInput }) =>
      fetch(`/api/assignments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Assignment updated!");
      setEditTarget(null);
      editReset();
    },
    onError: () => toast("Failed to update assignment", "error"),
  });

  const {
    register: editRegister,
    handleSubmit: editHandleSubmit,
    reset: editReset,
    setValue: editSetValue,
    formState: { errors: editErrors },
  } = useForm<AssignmentInput>({
    resolver: zodResolver(assignmentSchema),
  });

  const openEdit = (a: AssignmentData) => {
    setEditTarget(a);
    editSetValue("title", a.title);
    editSetValue("description", a.description || "");
    editSetValue("subject", a.subject || "");
    editSetValue("dueDate", a.dueDate ? a.dueDate.split("T")[0] : "");
    editSetValue("priority", a.priority as AssignmentInput["priority"]);
    editSetValue("status", a.status as AssignmentInput["status"]);
  };

  const cycleStatus = (id: string, current: string) => {
    const order = ["todo", "in_progress", "done"];
    const nextIdx = (order.indexOf(current) + 1) % order.length;
    updateStatusMutation.mutate({ id, status: order[nextIdx] });
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const isDueSoon = (dueDate?: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    return diffMs > 0 && diffMs < 48 * 60 * 60 * 1000;
  };

  const priorityWeight: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };

  const sortedAssignments = assignments ? [...assignments].sort((a, b) => {
    if (sortBy === "dueDate") {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === "priority") {
      return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }) : [];

  const tabs = [
    { id: "all", label: "All" },
    { id: "todo", label: "To Do" },
    { id: "in_progress", label: "In Progress" },
    { id: "done", label: "Done" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const statusOptions = [
    { value: "todo", label: "To Do" },
    { value: "in_progress", label: "In Progress" },
    { value: "done", label: "Done" },
  ];

  return (
    <div>
      <PageHeader
        title="Assignments"
        description="Track and manage your assignments and deadlines."
        action={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Add Assignment
          </Button>
        }
      />

      <div className="flex items-center justify-between mb-6">
        <Tabs tabs={tabs} activeTab={statusFilter} onChange={setStatusFilter} />
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="text-sm bg-transparent border rounded-lg px-2 py-1 text-gray-600 dark:text-gray-300"
            style={{ borderColor: "var(--border-normal)" }}
          >
            <option value="created">Newest</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : sortedAssignments.length > 0 ? (
        <div className="space-y-3">
          {sortedAssignments.map((a) => {
            const dueSoon = isDueSoon(a.dueDate) && a.status !== "done";
            return (
              <Card key={a.id} className={`!p-4 ${dueSoon ? "border-l-4 border-l-amber-400" : ""}`}>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => cycleStatus(a.id, a.status)}
                    className="shrink-0 transition-transform hover:scale-110"
                    title={`Status: ${statusLabels[a.status] || a.status}. Click to change.`}
                  >
                    {statusIcon[a.status] || statusIcon.todo}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium truncate ${a.status === "done" ? "line-through" : ""}`} style={a.status === "done" ? { color: 'var(--text-muted)' } : undefined}>
                        {a.title}
                      </h3>
                      {a.subject && <Badge variant="default">{a.subject}</Badge>}
                      {dueSoon && <Badge variant="warning">Due soon</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {a.dueDate && (
                        <span className={`flex items-center gap-1 ${isOverdue(a.dueDate) && a.status !== "done" ? "text-red-500 font-medium" : ""}`}>
                          <Calendar className="h-3 w-3" />
                          {isOverdue(a.dueDate) && a.status !== "done" ? "Overdue: " : "Due: "}
                          {formatDate(a.dueDate)}
                        </span>
                      )}
                      {a.description && (
                        <span className="truncate max-w-[200px]">{a.description}</span>
                      )}
                    </div>
                  </div>

                  <Badge variant={priorityBadgeVariant[a.priority] || "default"}>
                    {a.priority}
                  </Badge>

                  <button
                    onClick={() => openEdit(a)}
                    className="p-1 rounded-lg hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(a.id)}
                    className="p-1 rounded-lg hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<ClipboardList className="h-12 w-12" />}
          title={statusFilter === "all" ? "No assignments yet" : `No ${statusLabels[statusFilter]?.toLowerCase() || statusFilter} assignments`}
          description="Add assignments to track your deadlines and progress."
          action={
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Add Assignment
            </Button>
          }
        />
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); reset(); }} title="New Assignment" size="lg">
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          <Input
            id="a-title"
            label="Title"
            placeholder="e.g., Math Homework Chapter 5"
            {...register("title")}
            error={errors.title?.message}
          />
          <Textarea
            id="a-desc"
            label="Description (optional)"
            placeholder="Details about the assignment..."
            {...register("description")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="a-subject"
              label="Subject (optional)"
              placeholder="e.g., Mathematics"
              {...register("subject")}
            />
            <Input
              id="a-due"
              label="Due Date"
              type="date"
              {...register("dueDate")}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="a-priority"
              label="Priority"
              options={priorityOptions}
              {...register("priority")}
            />
            <Select
              id="a-status"
              label="Status"
              options={statusOptions}
              {...register("status")}
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Add Assignment</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Assignment Modal */}
      <Modal open={!!editTarget} onClose={() => { setEditTarget(null); editReset(); }} title="Edit Assignment" size="lg">
        <form onSubmit={editHandleSubmit((data) => { if (editTarget) editMutation.mutate({ id: editTarget.id, data }); })} className="space-y-4">
          <Input
            id="e-title"
            label="Title"
            placeholder="e.g., Math Homework Chapter 5"
            {...editRegister("title")}
            error={editErrors.title?.message}
          />
          <Textarea
            id="e-desc"
            label="Description (optional)"
            placeholder="Details about the assignment..."
            {...editRegister("description")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="e-subject"
              label="Subject (optional)"
              placeholder="e.g., Mathematics"
              {...editRegister("subject")}
            />
            <Input
              id="e-due"
              label="Due Date"
              type="date"
              {...editRegister("dueDate")}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="e-priority"
              label="Priority"
              options={priorityOptions}
              {...editRegister("priority")}
            />
            <Select
              id="e-status"
              label="Status"
              options={statusOptions}
              {...editRegister("status")}
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => { setEditTarget(null); editReset(); }}>Cancel</Button>
            <Button type="submit" loading={editMutation.isPending}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        title="Delete assignment?"
        description="This will permanently remove this assignment. This action cannot be undone."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
