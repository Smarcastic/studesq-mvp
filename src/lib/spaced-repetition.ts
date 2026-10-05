/**
 * SM-2 Spaced Repetition Algorithm
 * Based on SuperMemo 2 algorithm by Piotr Wozniak
 *
 * Quality ratings:
 * 0 - Complete blackout
 * 1 - Incorrect, but remembered upon seeing answer
 * 2 - Incorrect, but easy recall after seeing answer
 * 3 - Correct with serious difficulty
 * 4 - Correct with some hesitation
 * 5 - Perfect response
 */

interface SM2Input {
  quality: number; // 0-5
  repetitions: number;
  easeFactor: number;
  interval: number; // days
}

interface SM2Output {
  repetitions: number;
  easeFactor: number;
  interval: number; // days
  nextReview: Date;
}

export function calculateSM2(input: SM2Input): SM2Output {
  const { quality, repetitions, easeFactor, interval } = input;

  let newRepetitions: number;
  let newEaseFactor: number;
  let newInterval: number;

  if (quality < 3) {
    // Failed: reset repetitions
    newRepetitions = 0;
    newInterval = 1;
    newEaseFactor = easeFactor;
  } else {
    // Passed
    newRepetitions = repetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }

    // Update ease factor
    newEaseFactor =
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Minimum ease factor of 1.3
    if (newEaseFactor < 1.3) newEaseFactor = 1.3;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    repetitions: newRepetitions,
    easeFactor: Number(newEaseFactor.toFixed(2)),
    interval: newInterval,
    nextReview,
  };
}

/**
 * Map a simple difficulty rating (1-3) to SM-2 quality (0-5)
 */
export function difficultyToQuality(difficulty: "hard" | "good" | "easy"): number {
  switch (difficulty) {
    case "hard":
      return 2;
    case "good":
      return 4;
    case "easy":
      return 5;
  }
}
