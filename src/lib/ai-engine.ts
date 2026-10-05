/**
 * StudesQ Brain — AI Intelligence Layer
 *
 * Client-side AI utilities that analyze student data and generate
 * intelligent insights. These functions work on pre-fetched data
 * without requiring an external AI API.
 */

// =====================================================================
// 1. AI FLASHCARD GENERATOR
// =====================================================================

export interface GeneratedFlashcard {
  front: string;
  back: string;
  difficulty: number; // 1-5
  tags: string[];
}

/**
 * Generate flashcards from raw notes text.
 * Uses pattern recognition to extract key concepts, definitions,
 * formulas, and Q&A pairs from student notes.
 */
export function generateFlashcardsFromNotes(
  noteContent: string,
  subject?: string
): GeneratedFlashcard[] {
  const cards: GeneratedFlashcard[] = [];
  const lines = noteContent.split("\n").filter((l) => l.trim());

  for (const line of lines) {
    const trimmed = line.replace(/^[#\-*>]+\s*/, "").trim();
    if (!trimmed || trimmed.length < 10) continue;

    // Pattern: "Term: Definition" or "Term — Definition"
    const colonSplit = trimmed.match(
      /^(.{3,60})\s*[:—–]\s+(.{10,})/
    );
    if (colonSplit) {
      cards.push({
        front: `What is ${colonSplit[1].trim()}?`,
        back: colonSplit[2].trim(),
        difficulty: 3,
        tags: subject ? [subject.toLowerCase()] : [],
      });
      continue;
    }

    // Pattern: "Formula: X = Y" or lines containing "="
    const formulaMatch = trimmed.match(
      /(.+?)\s*=\s*(.+)/
    );
    if (
      formulaMatch &&
      formulaMatch[1].length < 40 &&
      formulaMatch[2].length < 100
    ) {
      cards.push({
        front: `What is the formula for ${formulaMatch[1].trim()}?`,
        back: `${formulaMatch[1].trim()} = ${formulaMatch[2].trim()}`,
        difficulty: 4,
        tags: subject ? [subject.toLowerCase(), "formula"] : ["formula"],
      });
      continue;
    }

    // Pattern: Key concept sentences (capitalize first word, > 20 chars)
    if (
      trimmed.length > 20 &&
      trimmed.length < 200 &&
      /^[A-Z]/.test(trimmed)
    ) {
      // Extract the main topic (first noun phrase)
      const topicMatch = trimmed.match(/^([\w\s]{3,30}?)\s+(is|are|was|were|means|refers|involves)/i);
      if (topicMatch) {
        cards.push({
          front: `Define: ${topicMatch[1].trim()}`,
          back: trimmed,
          difficulty: 2,
          tags: subject ? [subject.toLowerCase()] : [],
        });
      }
    }
  }

  return cards.slice(0, 20); // Cap at 20 cards
}

// =====================================================================
// 2. AI STUDY PLAN GENERATOR
// =====================================================================

export interface StudyPlanDay {
  date: string; // ISO date string
  dayLabel: string; // "Monday", "Tuesday"...
  blocks: StudyBlock[];
  totalMinutes: number;
}

export interface StudyBlock {
  subject: string;
  durationMinutes: number;
  type: "study" | "review" | "practice" | "break";
  priority: "high" | "medium" | "low";
}

export interface StudyPlanInput {
  subjects: { name: string; examDate?: string; difficulty: number }[];
  availableHoursPerDay: number;
  startDate?: string;
  daysToGenerate?: number;
}

/**
 * Generate a smart study plan based on subjects, exam dates, and available time.
 * Uses spaced repetition principles and prioritizes subjects closer to exams.
 */
export function generateStudyPlan(input: StudyPlanInput): StudyPlanDay[] {
  const {
    subjects,
    availableHoursPerDay,
    startDate = new Date().toISOString().split("T")[0],
    daysToGenerate = 14,
  } = input;

  const availableMinutes = availableHoursPerDay * 60;
  const plan: StudyPlanDay[] = [];
  const dayNames = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday",
  ];

  // Calculate urgency scores
  const scored = subjects.map((s) => {
    let urgency = s.difficulty;
    if (s.examDate) {
      const daysUntilExam = Math.max(
        1,
        Math.ceil(
          (new Date(s.examDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      urgency += Math.max(0, 10 - daysUntilExam) * 2; // Boost urgency as exam approaches
    }
    return { ...s, urgency };
  });

  // Sort by urgency (highest first)
  scored.sort((a, b) => b.urgency - a.urgency);

  for (let d = 0; d < daysToGenerate; d++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + d);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Reduce study time on weekends
    const dayMinutes = isWeekend
      ? Math.round(availableMinutes * 0.7)
      : availableMinutes;

    const blocks: StudyBlock[] = [];
    let remaining = dayMinutes;

    // Distribute time across subjects with rotation
    const rotated = [...scored];
    // Rotate subjects each day for variety
    for (let r = 0; r < d % scored.length; r++) {
      const first = rotated.shift()!;
      rotated.push(first);
    }

    for (const subject of rotated) {
      if (remaining <= 0) break;

      const weight = subject.urgency / scored.reduce((s, x) => s + x.urgency, 0);
      const blockMinutes = Math.min(
        remaining,
        Math.max(20, Math.round(dayMinutes * weight))
      );

      // Determine block type based on day pattern
      const type: StudyBlock["type"] =
        d % 3 === 0 ? "review" : d % 4 === 0 ? "practice" : "study";

      blocks.push({
        subject: subject.name,
        durationMinutes: blockMinutes,
        type,
        priority: subject.urgency > 8 ? "high" : subject.urgency > 4 ? "medium" : "low",
      });

      remaining -= blockMinutes;

      // Add break after 45+ min blocks
      if (blockMinutes >= 45 && remaining > 10) {
        blocks.push({
          subject: "Break",
          durationMinutes: 10,
          type: "break",
          priority: "low",
        });
        remaining -= 10;
      }
    }

    plan.push({
      date: date.toISOString().split("T")[0],
      dayLabel: dayNames[dayOfWeek],
      blocks,
      totalMinutes: dayMinutes - remaining,
    });
  }

  return plan;
}

// =====================================================================
// 3. AI WEAKNESS DETECTION
// =====================================================================

export interface WeaknessInsight {
  type: "subject" | "time" | "habit" | "mood";
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  icon: string; // emoji
  actionable: string; // recommendation
}

export interface StudentAnalyticsData {
  studySessions: {
    subject?: string;
    duration: number;
    completedAt: string;
    focusScore?: number;
    mood?: string;
  }[];
  habits: {
    title: string;
    logs: { date: string; done: boolean }[];
  }[];
  moodEntries: {
    mood: string;
    date: string;
  }[];
  flashcardScores?: {
    deckTitle: string;
    correctRate: number;
  }[];
}

/**
 * Analyze student behavior data and detect weaknesses, patterns, and opportunities.
 */
export function detectWeaknesses(data: StudentAnalyticsData): WeaknessInsight[] {
  const insights: WeaknessInsight[] = [];

  // --- Subject Analysis ---
  const subjectTime: Record<string, number> = {};
  const subjectSessions: Record<string, number> = {};
  for (const s of data.studySessions) {
    const subj = s.subject || "Unknown";
    subjectTime[subj] = (subjectTime[subj] || 0) + s.duration;
    subjectSessions[subj] = (subjectSessions[subj] || 0) + 1;
  }

  const subjects = Object.entries(subjectTime).sort(
    (a, b) => a[1] - b[1]
  );

  if (subjects.length >= 2) {
    const weakest = subjects[0];
    const strongest = subjects[subjects.length - 1];
    if (strongest[1] > weakest[1] * 3) {
      insights.push({
        type: "subject",
        title: `${weakest[0]} needs attention`,
        description: `You've spent ${Math.round(weakest[1] / 60)}min on ${weakest[0]} vs ${Math.round(strongest[1] / 60)}min on ${strongest[0]}. Consider rebalancing.`,
        severity: "warning",
        icon: "📚",
        actionable: `Schedule 2-3 extra ${weakest[0]} sessions this week.`,
      });
    }
  }

  // --- Time-of-Day Analysis ---
  const hourBuckets: Record<string, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };

  for (const s of data.studySessions) {
    const hour = new Date(s.completedAt).getHours();
    if (hour >= 5 && hour < 12) hourBuckets.morning += s.duration;
    else if (hour >= 12 && hour < 17) hourBuckets.afternoon += s.duration;
    else if (hour >= 17 && hour < 21) hourBuckets.evening += s.duration;
    else hourBuckets.night += s.duration;
  }

  const totalTime = Object.values(hourBuckets).reduce((a, b) => a + b, 0);
  if (totalTime > 0 && hourBuckets.night / totalTime > 0.4) {
    insights.push({
      type: "time",
      title: "Late-night study dominance",
      description: `${Math.round((hourBuckets.night / totalTime) * 100)}% of your study time is after 9pm. Research shows focus drops significantly late at night.`,
      severity: "warning",
      icon: "🌙",
      actionable: "Try shifting 1-2 sessions to morning or afternoon for better retention.",
    });
  }

  // --- Focus Score Trend ---
  const sessionsWithFocus = data.studySessions.filter(
    (s) => s.focusScore !== undefined && s.focusScore !== null
  );
  if (sessionsWithFocus.length >= 5) {
    const recent = sessionsWithFocus.slice(-5);
    const avgFocus =
      recent.reduce((a, s) => a + (s.focusScore || 0), 0) / recent.length;
    if (avgFocus < 60) {
      insights.push({
        type: "habit",
        title: "Focus quality declining",
        description: `Your average focus score is ${Math.round(avgFocus)}/100 over the last 5 sessions.`,
        severity: "critical",
        icon: "🎯",
        actionable: "Try shorter study blocks (25min Pomodoro) and eliminate distractions.",
      });
    }
  }

  // --- Mood Correlation ---
  const moodValues: Record<string, number> = {
    THRIVING: 5,
    GOOD: 4,
    OKAY: 3,
    STRUGGLING: 2,
    BURNT_OUT: 1,
  };

  const recentMoods = data.moodEntries.slice(-7);
  if (recentMoods.length >= 3) {
    const avgMood =
      recentMoods.reduce((a, m) => a + (moodValues[m.mood] || 3), 0) /
      recentMoods.length;
    if (avgMood < 2.5) {
      insights.push({
        type: "mood",
        title: "Well-being needs attention",
        description: `Your mood has been low recently. Consider taking a wellness break.`,
        severity: "critical",
        icon: "💛",
        actionable: "Take a rest day, talk to someone, or try a lighter study schedule.",
      });
    }
  }

  // --- Habit Consistency ---
  for (const habit of data.habits) {
    const last7 = habit.logs
      .filter((l) => {
        const d = new Date(l.date);
        const now = new Date();
        return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
      })
      .filter((l) => l.done);

    if (last7.length <= 2 && habit.logs.length > 0) {
      insights.push({
        type: "habit",
        title: `"${habit.title}" streak breaking`,
        description: `Only completed ${last7.length}/7 days this week.`,
        severity: "info",
        icon: "🔗",
        actionable: `Set a daily reminder for "${habit.title}" at a consistent time.`,
      });
    }
  }

  // --- Flashcard Performance ---
  if (data.flashcardScores) {
    for (const deck of data.flashcardScores) {
      if (deck.correctRate < 0.5) {
        insights.push({
          type: "subject",
          title: `${deck.deckTitle} accuracy low`,
          description: `Only ${Math.round(deck.correctRate * 100)}% accuracy. Review needed.`,
          severity: "warning",
          icon: "🃏",
          actionable: `Spend 15 minutes daily reviewing ${deck.deckTitle} flashcards.`,
        });
      }
    }
  }

  return insights.sort((a, b) => {
    const sev = { critical: 0, warning: 1, info: 2 };
    return sev[a.severity] - sev[b.severity];
  });
}

// =====================================================================
// 4. AI ACHIEVEMENT ENHANCER
// =====================================================================

export interface EnhancedAchievement {
  title: string;
  description: string;
  suggestedTags: string[];
  impactMetrics: string[];
}

/**
 * Enhance an achievement's title and description to sound more professional
 * and suggest tags and impact metrics.
 */
export function enhanceAchievement(
  title: string,
  description: string,
  category: string
): EnhancedAchievement {
  // Professional title patterns by category
  const prefixes: Record<string, string[]> = {
    academic: ["Academic Excellence:", "Scholar Achievement:"],
    competition: ["Competition Victory:", "Competitive Achievement:"],
    leadership: ["Leadership Role:", "Student Leadership:"],
    community_service: ["Community Impact:", "Service Achievement:"],
    extracurricular: ["Extracurricular Achievement:", "Activity Highlight:"],
    creative: ["Creative Achievement:", "Creative Excellence:"],
    sports: ["Athletic Achievement:", "Sports Excellence:"],
    certificate: ["Certification:", "Credential Earned:"],
    other: ["Notable Achievement:"],
  };

  // Clean up title
  let enhancedTitle = title.trim();
  // Capitalize properly
  enhancedTitle = enhancedTitle
    .split(" ")
    .map((w) =>
      ["a", "an", "the", "in", "on", "at", "for", "of", "and", "or", "but"].includes(
        w.toLowerCase()
      )
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(" ");
  // Make first word always capitalized
  enhancedTitle = enhancedTitle.charAt(0).toUpperCase() + enhancedTitle.slice(1);

  // Enhance description
  let enhancedDesc = description || enhancedTitle;
  if (enhancedDesc.length < 50) {
    enhancedDesc = `Demonstrated excellence by achieving: ${enhancedDesc}. This accomplishment reflects dedication, skill development, and consistent effort.`;
  }

  // Suggest tags
  const tagPool: Record<string, string[]> = {
    academic: ["academic", "GPA", "honor roll", "scholarship"],
    competition: ["competition", "award", "winner", "finalist"],
    leadership: ["leadership", "president", "captain", "organizer"],
    community_service: ["service", "volunteer", "community", "impact"],
    extracurricular: ["club", "activity", "team", "organization"],
    creative: ["art", "writing", "music", "design", "creative"],
    sports: ["athletics", "sports", "varsity", "team", "fitness"],
    certificate: ["certification", "credential", "qualification"],
    other: ["achievement", "milestone"],
  };
  const suggestedTags = tagPool[category] || tagPool.other;

  // Suggest impact metrics
  const impactMetrics: string[] = [];
  // Extract numbers from description
  const numbers = (description || "").match(/\d+/g);
  if (numbers) {
    for (const n of numbers.slice(0, 3)) {
      const num = parseInt(n);
      if (num > 0 && num < 10000) {
        impactMetrics.push(`${num}+ participants/hours involved`);
      }
    }
  }
  if (impactMetrics.length === 0) {
    impactMetrics.push(
      "Add number of participants, hours invested, or people impacted"
    );
  }

  return {
    title: enhancedTitle,
    description: enhancedDesc,
    suggestedTags,
    impactMetrics,
  };
}

// =====================================================================
// 5. OPPORTUNITY MATCH SCORING
// =====================================================================

export interface OpportunityMatch {
  score: number; // 0-100
  reasons: string[];
}

export function scoreOpportunityMatch(
  opportunity: {
    type: string;
    tags: string[];
    title: string;
    description: string;
  },
  studentProfile: {
    interests: string[];
    skills: string[];
    achievements: { category: string; title: string }[];
    grade?: string;
  }
): OpportunityMatch {
  let score = 30; // Base score
  const reasons: string[] = [];

  const oppText = `${opportunity.title} ${opportunity.description} ${opportunity.tags.join(" ")}`.toLowerCase();

  // Match interests
  for (const interest of studentProfile.interests) {
    if (oppText.includes(interest.toLowerCase())) {
      score += 15;
      reasons.push(`Matches your interest in ${interest}`);
    }
  }

  // Match skills
  for (const skill of studentProfile.skills) {
    if (oppText.includes(skill.toLowerCase())) {
      score += 10;
      reasons.push(`Leverages your ${skill} skills`);
    }
  }

  // Match achievement categories
  const achievementCategories = new Set(
    studentProfile.achievements.map((a) => a.category)
  );
  const categoryMap: Record<string, string[]> = {
    scholarship: ["academic", "leadership"],
    competition: ["competition", "academic"],
    internship: ["leadership", "extracurricular"],
    program: ["academic", "creative"],
    volunteer: ["community_service"],
  };
  const relevantCategories = categoryMap[opportunity.type] || [];
  for (const cat of relevantCategories) {
    if (achievementCategories.has(cat)) {
      score += 10;
      reasons.push(`Your ${cat} achievements strengthen your application`);
      break;
    }
  }

  return {
    score: Math.min(100, score),
    reasons: reasons.slice(0, 3),
  };
}
