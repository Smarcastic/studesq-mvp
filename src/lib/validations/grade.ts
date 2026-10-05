import { z } from "zod/v4";

export const gradeSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(100),
  courseName: z.string().max(200).optional(),
  grade: z.string().min(1, "Grade is required").max(10),
  credits: z.number().min(0.5).max(10).optional().default(1.0),
  weight: z.enum(["regular", "honors", "ap", "ib"]).optional().default("regular"),
  semester: z.string().max(50).optional(),
  year: z.string().max(20).optional(),
});

export type GradeInput = z.input<typeof gradeSchema>;

export const weightLabels: Record<string, string> = {
  regular: "Regular",
  honors: "Honors",
  ap: "AP",
  ib: "IB",
};

export const weightMultipliers: Record<string, number> = {
  regular: 0,
  honors: 0.5,
  ap: 1.0,
  ib: 1.0,
};

// Standard GPA scale
export function letterToGPA(grade: string): number | null {
  const scale: Record<string, number> = {
    "A+": 4.0, "A": 4.0, "A-": 3.7,
    "B+": 3.3, "B": 3.0, "B-": 2.7,
    "C+": 2.3, "C": 2.0, "C-": 1.7,
    "D+": 1.3, "D": 1.0, "D-": 0.7,
    "F": 0.0,
  };
  return scale[grade.toUpperCase()] ?? null;
}

export function calculateGPA(
  grades: { grade: string; credits: number; weight: string }[]
): { unweighted: number; weighted: number } {
  let totalPoints = 0;
  let totalWeightedPoints = 0;
  let totalCredits = 0;

  for (const g of grades) {
    const gpa = letterToGPA(g.grade);
    if (gpa === null) continue;
    totalPoints += gpa * g.credits;
    totalWeightedPoints += (gpa + (weightMultipliers[g.weight] || 0)) * g.credits;
    totalCredits += g.credits;
  }

  if (totalCredits === 0) return { unweighted: 0, weighted: 0 };

  return {
    unweighted: Number((totalPoints / totalCredits).toFixed(2)),
    weighted: Number((totalWeightedPoints / totalCredits).toFixed(2)),
  };
}
