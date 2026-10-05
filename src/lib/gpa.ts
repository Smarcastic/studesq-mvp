const GRADE_POINTS: Record<string, number> = {
  "A+": 4.3,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  F: 0.0,
};

const WEIGHT_BONUS: Record<string, number> = {
  regular: 0,
  honors: 0.5,
  ap: 1.0,
  ib: 1.0,
};

export function gradeToPoints(grade: string): number {
  return GRADE_POINTS[grade] ?? 0;
}

export function calculateGPA(
  grades: { grade: string; credits: number; weight: string }[]
): {
  unweighted: number;
  weighted: number;
  bySemester: Record<string, { unweighted: number; weighted: number }>;
} {
  if (grades.length === 0) {
    return { unweighted: 0, weighted: 0, bySemester: {} };
  }

  let totalCredits = 0;
  let totalUnweightedPoints = 0;
  let totalWeightedPoints = 0;

  for (const g of grades) {
    const basePoints = gradeToPoints(g.grade);
    const bonus = WEIGHT_BONUS[g.weight] ?? 0;
    totalCredits += g.credits;
    totalUnweightedPoints += basePoints * g.credits;
    totalWeightedPoints += (basePoints + bonus) * g.credits;
  }

  const unweighted = totalCredits > 0 ? totalUnweightedPoints / totalCredits : 0;
  const weighted = totalCredits > 0 ? totalWeightedPoints / totalCredits : 0;

  return {
    unweighted: Math.round(unweighted * 100) / 100,
    weighted: Math.round(weighted * 100) / 100,
    bySemester: {},
  };
}
