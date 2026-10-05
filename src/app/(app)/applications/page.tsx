"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import {
  GraduationCap,
  Plus,
  Trash2,
  ExternalLink,
  Calendar,
  FileText,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { FadeUp, StaggerList, StaggerItem } from "@/components/ui/motion";
import { Textarea } from "@/components/ui/textarea";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ApplicationStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "INTERVIEW"
  | "ACCEPTED"
  | "WAITLISTED"
  | "REJECTED"
  | "DEFERRED";

interface CollegeApplication {
  id: string;
  collegeName: string;
  programName?: string;
  applicationUrl?: string;
  deadline?: string;
  status: ApplicationStatus;
  notes?: string;
  isEarlyDecision: boolean;
  essays: { id: string; prompt: string; wordCount: number; wordLimit: number }[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const addApplicationSchema = z.object({
  collegeName: z.string().min(1, "College name is required"),
  programName: z.string().optional(),
  deadline: z.string().optional(),
  applicationUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  isEarlyDecision: z.boolean().optional(),
  notes: z.string().optional(),
});

type AddApplicationForm = z.infer<typeof addApplicationSchema>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "WAITLISTED", label: "Waitlisted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "DEFERRED", label: "Deferred" },
];

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "NOT_STARTED", label: "Not Started" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "SUBMITTED", label: "Submitted" },
  { id: "decisions", label: "Decisions" },
];

const DECISION_STATUSES: ApplicationStatus[] = [
  "ACCEPTED",
  "WAITLISTED",
  "REJECTED",
  "DEFERRED",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusLabel(status: ApplicationStatus): string {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

function statusBadge(status: ApplicationStatus) {
  const label = statusLabel(status);

  switch (status) {
    case "NOT_STARTED":
      return <Badge variant="default">{label}</Badge>;
    case "IN_PROGRESS":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          {label}
        </Badge>
      );
    case "SUBMITTED":
      return <Badge variant="primary">{label}</Badge>;
    case "INTERVIEW":
      return (
        <Badge className="bg-purple-50 text-purple-700 border-purple-200">
          {label}
        </Badge>
      );
    case "ACCEPTED":
      return <Badge variant="success">{label}</Badge>;
    case "WAITLISTED":
      return <Badge variant="warning">{label}</Badge>;
    case "REJECTED":
      return <Badge variant="error">{label}</Badge>;
    case "DEFERRED":
      return (
        <Badge className="bg-orange-50 text-orange-700 border-orange-200">
          {label}
        </Badge>
      );
    default:
      return <Badge variant="default">{label}</Badge>;
  }
}

function deadlineText(deadline: string): { text: string; isPast: boolean } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(deadline);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: "Past due", isPast: true };
  if (diffDays === 0) return { text: "Due today", isPast: false };
  if (diffDays === 1) return { text: "Due tomorrow", isPast: false };
  return { text: `Due in ${diffDays} days`, isPast: false };
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchApplications(): Promise<CollegeApplication[]> {
  const res = await fetch("/api/applications");
  if (!res.ok) throw new Error("Failed to fetch applications");
  return res.json();
}

async function createApplication(data: AddApplicationForm) {
  const body: Record<string, unknown> = { ...data };
  // Strip empty optional strings
  if (!body.applicationUrl) delete body.applicationUrl;
  if (!body.programName) delete body.programName;
  if (!body.deadline) delete body.deadline;
  if (!body.notes) delete body.notes;

  const res = await fetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create application");
  return res.json();
}

async function updateApplicationStatus(id: string, status: ApplicationStatus) {
  const res = await fetch(`/api/applications/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update application");
  return res.json();
}

async function deleteApplication(id: string) {
  const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete application");
  return res.json();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // ---- Queries & Mutations ----

  const {
    data: applications = [],
    isLoading,
    isError,
  } = useQuery<CollegeApplication[]>({
    queryKey: ["applications"],
    queryFn: fetchApplications,
  });

  const createMutation = useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast("Application added", "success");
      setModalOpen(false);
      reset();
    },
    onError: () => toast("Failed to add application", "error"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      updateApplicationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast("Status updated", "success");
    },
    onError: () => toast("Failed to update status", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast("Application deleted", "success");
    },
    onError: () => toast("Failed to delete application", "error"),
  });

  // ---- Form ----

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddApplicationForm>({
    resolver: zodResolver(addApplicationSchema),
    defaultValues: {
      collegeName: "",
      programName: "",
      deadline: "",
      applicationUrl: "",
      isEarlyDecision: false,
      notes: "",
    },
  });

  const onSubmit = (data: AddApplicationForm) => {
    createMutation.mutate(data);
  };

  // ---- Filtering ----

  const filtered = applications.filter((app) => {
    if (activeTab === "all") return true;
    if (activeTab === "decisions") return DECISION_STATUSES.includes(app.status);
    return app.status === activeTab;
  });

  // ---- Render ----

  return (
    <div>
      <PageHeader
        title="College Applications"
        description="Track and manage your college applications."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Application
          </Button>
        }
      />

      <FadeUp>
        {/* Status filter tabs */}
        <div className="mb-6">
          <Tabs
            tabs={FILTER_TABS}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <div className="space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <Card>
            <div className="flex flex-col items-center py-12 gap-3">
              <GraduationCap className="h-12 w-12 text-slate-300" />
              <p className="text-slate-500">
                Failed to load applications. Please try again.
              </p>
            </div>
          </Card>
        )}

        {/* Empty state */}
        {!isLoading && !isError && filtered.length === 0 && (
          <Card>
            <EmptyState
              icon={<GraduationCap className="h-12 w-12" />}
              title={
                activeTab === "all"
                  ? "No applications yet"
                  : "No applications in this category"
              }
              description={
                activeTab === "all"
                  ? "Add your first college application to start tracking your progress."
                  : "Applications matching this filter will appear here."
              }
              action={
                activeTab === "all" ? (
                  <Button onClick={() => setModalOpen(true)} size="sm">
                    <Plus className="h-4 w-4" />
                    Add Application
                  </Button>
                ) : undefined
              }
            />
          </Card>
        )}

        {/* Application cards */}
        {!isLoading && !isError && filtered.length > 0 && (
          <StaggerList className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((app) => {
              const deadline = app.deadline
                ? deadlineText(app.deadline)
                : null;
              const totalEssays = app.essays.length;
              const completedEssays = app.essays.filter(
                (e) => e.wordCount >= e.wordLimit
              ).length;

              return (
                <StaggerItem key={app.id}>
                  <div
                    className="relative group"
                    onMouseEnter={() => setHoveredId(app.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <Card hover>
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-lg text-slate-900 truncate">
                          {app.collegeName}
                        </h3>
                        {app.programName && (
                          <p className="text-slate-500 text-sm mt-0.5 truncate">
                            {app.programName}
                          </p>
                        )}
                      </div>

                      {/* Delete button — visible on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(app.id);
                        }}
                        className={`p-1.5 rounded-lg hover:bg-red-50 transition-all ${
                          hoveredId === app.id
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                        aria-label="Delete application"
                      >
                        <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                      </button>
                    </div>

                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {statusBadge(app.status)}
                      {app.isEarlyDecision && (
                        <Badge variant="teal">Early Decision</Badge>
                      )}
                    </div>

                    {/* Info row */}
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500">
                      {deadline && (
                        <span
                          className={`flex items-center gap-1.5 ${
                            deadline.isPast ? "text-red-500" : ""
                          }`}
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          {deadline.text}
                        </span>
                      )}

                      {totalEssays > 0 && (
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          {completedEssays}/{totalEssays} essays
                        </span>
                      )}

                      {app.applicationUrl && (
                        <a
                          href={app.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-cyan-600 hover:text-cyan-700 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Application
                        </a>
                      )}
                    </div>

                    {/* Status change dropdown */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <Select
                        options={STATUS_OPTIONS}
                        value={app.status}
                        onChange={(e) =>
                          updateStatusMutation.mutate({
                            id: app.id,
                            status: e.target.value as ApplicationStatus,
                          })
                        }
                        className="text-xs"
                      />
                    </div>
                  </Card>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerList>
        )}
      </FadeUp>

      {/* Add Application Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          reset();
        }}
        title="Add Application"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="collegeName"
            label="College Name"
            placeholder="e.g. MIT, Stanford"
            error={errors.collegeName?.message}
            {...register("collegeName")}
          />

          <Input
            id="programName"
            label="Program Name"
            placeholder="e.g. Computer Science"
            error={errors.programName?.message}
            {...register("programName")}
          />

          <Input
            id="deadline"
            label="Deadline"
            type="date"
            error={errors.deadline?.message}
            {...register("deadline")}
          />

          <Input
            id="applicationUrl"
            label="Application URL"
            placeholder="https://..."
            error={errors.applicationUrl?.message}
            {...register("applicationUrl")}
          />

          <Textarea
            id="notes"
            label="Notes"
            placeholder="Any notes about this application..."
            rows={3}
            error={errors.notes?.message}
            {...register("notes")}
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              {...register("isEarlyDecision")}
            />
            <span className="text-sm text-slate-700">Early Decision</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setModalOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Add Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
