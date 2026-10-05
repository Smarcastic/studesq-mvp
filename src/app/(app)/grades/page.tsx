"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { gradeSchema, weightLabels, calculateGPA, type GradeInput } from "@/lib/validations/grade";
import { Plus, GraduationCap, Trash2, Award } from "lucide-react";
import { WhatIfCalculator } from "@/components/grades/WhatIfCalculator";

interface GradeData {
  id: string;
  subject: string;
  courseName?: string;
  grade: string;
  credits: number;
  weight: string;
  semester?: string;
  year?: string;
}

export default function GradesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: grades, isLoading } = useQuery<GradeData[]>({
    queryKey: ["grades"],
    queryFn: () => fetch("/api/grades").then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GradeInput>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      subject: "",
      courseName: "",
      grade: "",
      credits: 1.0,
      weight: "regular",
      semester: "",
      year: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: GradeInput) =>
      fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast("Grade added!");
      setShowForm(false);
      reset();
    },
    onError: () => toast("Failed to add grade", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/grades/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast("Grade deleted");
    },
    onError: () => toast("Failed to delete grade", "error"),
  });

  const gpa = grades ? calculateGPA(grades) : { unweighted: 0, weighted: 0 };

  // Group by semester
  const semesters: Record<string, GradeData[]> = {};
  if (grades) {
    for (const g of grades) {
      const key = g.semester || "Unsorted";
      if (!semesters[key]) semesters[key] = [];
      semesters[key].push(g);
    }
  }

  const weightOptions = [
    { value: "regular", label: "Regular" },
    { value: "honors", label: "Honors (+0.5)" },
    { value: "ap", label: "AP (+1.0)" },
    { value: "ib", label: "IB (+1.0)" },
  ];

  const gradeOptions = [
    "A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"
  ].map((g) => ({ value: g, label: g }));

  return (
    <div>
      <PageHeader
        title="Grades & GPA"
        description="Monitor your academic performance."
        action={
          <div className="flex gap-2">
            {grades && grades.length > 0 && (
              <WhatIfCalculator
                grades={grades}
                gradeOptions={gradeOptions}
                weightOptions={weightOptions}
              />
            )}
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Add Grade
            </Button>
          </div>
        }
      />

      {grades && grades.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="text-center">
            <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Unweighted GPA</p>
            <p className="text-4xl font-bold text-cyan-500">{gpa.unweighted}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>4.0 Scale</p>
            <Progress value={gpa.unweighted * 25} className="mt-3" />
          </Card>
          <Card className="text-center">
            <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Weighted GPA</p>
            <p className="text-4xl font-bold text-indigo-500">{gpa.weighted}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>5.0 Scale</p>
            <Progress value={gpa.weighted * 20} color="secondary" className="mt-3" />
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : grades && grades.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(semesters).map(([semester, semGrades]) => (
            <div key={semester}>
              <h3 className="font-semibold text-sm uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>{semester}</h3>
              <div className="space-y-2">
                {semGrades.map((g) => (
                  <Card key={g.id} className="!p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-cyan-50 shrink-0">
                        <GraduationCap className="h-4 w-4 text-cyan-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{g.subject}</h4>
                          {g.courseName && <span className="text-sm" style={{ color: 'var(--text-muted)' }}>- {g.courseName}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span>{g.credits} credits</span>
                          {g.weight !== "regular" && (
                            <Badge variant="secondary">{weightLabels[g.weight]}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-cyan-500">{g.grade}</div>
                      <button
                        onClick={() => setDeleteTarget(g.id)}
                        className="p-1 rounded-lg hover:text-red-500 hover:bg-red-50 transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Award className="h-12 w-12" />}
          title="No grades yet"
          description="Add your course grades to calculate your GPA."
          action={
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Add Grade
            </Button>
          }
        />
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); reset(); }} title="Add Grade" size="lg">
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="g-subject"
              label="Subject"
              placeholder="e.g., Mathematics"
              {...register("subject")}
              error={errors.subject?.message}
            />
            <Input
              id="g-course"
              label="Course Name (optional)"
              placeholder="e.g., AP Calculus BC"
              {...register("courseName")}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              id="g-grade"
              label="Grade"
              options={gradeOptions}
              {...register("grade")}
              error={errors.grade?.message}
            />
            <Input
              id="g-credits"
              label="Credits"
              type="number"
              step="0.5"
              {...register("credits", { valueAsNumber: true })}
              error={errors.credits?.message}
            />
            <Select
              id="g-weight"
              label="Weight"
              options={weightOptions}
              {...register("weight")}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="g-semester"
              label="Semester"
              placeholder="e.g., Fall 2025"
              {...register("semester")}
            />
            <Input
              id="g-year"
              label="Year"
              placeholder="e.g., Junior"
              {...register("year")}
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Add Grade</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        title="Delete grade?"
        description="This will permanently remove this grade entry. This action cannot be undone."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
