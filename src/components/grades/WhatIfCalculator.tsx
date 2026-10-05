"use client";

import { useState, useMemo } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { FadeUp, CountUp } from "@/components/ui/motion";
import { calculateGPA } from "@/lib/validations/grade";
import { Calculator, Plus, Trash2, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface GradeData {
  id: string;
  subject: string;
  grade: string;
  credits: number;
  weight: string;
}

interface WhatIfCalculatorProps {
  grades: GradeData[];
  gradeOptions: { value: string; label: string }[];
  weightOptions: { value: string; label: string }[];
}

interface HypotheticalGrade {
  id: string;
  subject: string;
  grade: string;
  credits: number;
  weight: string;
}

export function WhatIfCalculator({ grades, gradeOptions, weightOptions }: WhatIfCalculatorProps) {
  const [open, setOpen] = useState(false);
  const [hypotheticals, setHypotheticals] = useState<HypotheticalGrade[]>([]);
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [credits, setCredits] = useState("1");
  const [weight, setWeight] = useState("regular");

  const currentGPA = useMemo(() => calculateGPA(grades), [grades]);

  const projectedGPA = useMemo(() => {
    if (hypotheticals.length === 0) return currentGPA;
    return calculateGPA([...grades, ...hypotheticals]);
  }, [grades, hypotheticals, currentGPA]);

  const uwDelta = hypotheticals.length > 0 ? projectedGPA.unweighted - currentGPA.unweighted : 0;
  const wDelta = hypotheticals.length > 0 ? projectedGPA.weighted - currentGPA.weighted : 0;

  const addHypothetical = () => {
    if (!subject.trim() || !grade) return;
    setHypotheticals((prev) => [
      ...prev,
      {
        id: `hyp-${Date.now()}`,
        subject: subject.trim(),
        grade,
        credits: parseFloat(credits) || 1,
        weight,
      },
    ]);
    setSubject("");
    setGrade("");
    setCredits("1");
    setWeight("regular");
  };

  const removeHypothetical = (id: string) => {
    setHypotheticals((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Calculator className="h-4 w-4" /> What If?
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="GPA What-If Calculator" size="lg">
        <div className="space-y-5">
          {/* Current vs Projected */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Current GPA</p>
              <p className="text-3xl font-bold text-cyan-500">{currentGPA.unweighted}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Weighted: {currentGPA.weighted}</p>
            </div>
            <div
              className={`p-4 rounded-xl text-center ${
                hypotheticals.length > 0
                  ? uwDelta >= 0 ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20" : "bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20"
                  : ""
              }`}
              style={hypotheticals.length === 0 ? { background: 'var(--bg-elevated)' } : undefined}
            >
              <p className="text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Projected GPA</p>
              <p className={`text-3xl font-bold ${
                hypotheticals.length === 0 ? "text-slate-300 dark:text-slate-600" :
                uwDelta >= 0 ? "text-emerald-500" : "text-red-500"
              }`}>
                {hypotheticals.length > 0 ? projectedGPA.unweighted : "—"}
              </p>
              {hypotheticals.length > 0 && (
                <div className="flex items-center justify-center gap-2 mt-0.5">
                  <span className={`text-xs font-semibold flex items-center gap-0.5 ${
                    uwDelta >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {uwDelta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {uwDelta >= 0 ? "+" : ""}{uwDelta.toFixed(2)}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    W: {wDelta >= 0 ? "+" : ""}{wDelta.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Add hypothetical form */}
          <div className="p-4 rounded-xl border border-dashed" style={{ borderColor: 'var(--border-normal)', background: 'var(--bg-elevated)' }}>
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Add Hypothetical Grade</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                id="hyp-subject"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <Select
                id="hyp-grade"
                options={[{ value: "", label: "Grade" }, ...gradeOptions]}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              />
              <Input
                id="hyp-credits"
                type="number"
                placeholder="Credits"
                step="0.5"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
              />
              <Select
                id="hyp-weight"
                options={weightOptions}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="flex justify-end mt-3 gap-2">
              {hypotheticals.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setHypotheticals([])}
                >
                  Clear all
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={addHypothetical}
                disabled={!subject.trim() || !grade}
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
          </div>

          {/* Hypothetical grades list */}
          {hypotheticals.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Hypothetical Grades ({hypotheticals.length})
              </p>
              {hypotheticals.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-cyan-200 bg-cyan-50/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{h.subject}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {h.credits} credits · {h.weight !== "regular" ? h.weight.toUpperCase() : "Regular"}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-cyan-500">{h.grade}</span>
                  <button
                    onClick={() => removeHypothetical(h.id)}
                    className="p-1 rounded-lg hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {hypotheticals.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
              Add hypothetical grades above to see how your GPA would change
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
