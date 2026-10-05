import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import * as bcrypt from "bcryptjs";
import * as path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create demo student user
  const hashedPassword = await bcrypt.hash("demo123", 12);

  const user = await prisma.user.upsert({
    where: { email: "alex@demo.com" },
    update: {},
    create: {
      email: "alex@demo.com",
      name: "Alex Johnson",
      password: hashedPassword,
      role: "student",
      bio: "Aspiring computer scientist with a passion for mathematics and creative writing.",
      school: "Lincoln High School",
      grade: "Junior (11th)",
      graduationYear: 2026,
      location: "Portland, OR",
      interests: JSON.stringify(["Computer Science", "Mathematics", "Creative Writing", "Robotics"]),
      skills: JSON.stringify(["Python", "JavaScript", "Public Speaking", "3D Printing"]),
      languages: JSON.stringify(["English", "Spanish"]),
      academicGoals: "Get accepted into a top CS program",
    },
  });

  console.log(`Created user: ${user.name} (${user.email})`);

  // Achievements
  const achievements = [
    {
      title: "Science Fair First Place",
      description: "Won first place at the regional science fair with a project on renewable energy systems.",
      category: "competition",
      date: new Date("2025-03-15"),
      issuingOrg: "Regional Science Foundation",
      tags: JSON.stringify(["science", "competition", "renewable energy"]),
      isHighlight: true,
    },
    {
      title: "AP Computer Science A — Score: 5",
      description: "Achieved a perfect score on the AP Computer Science A exam.",
      category: "academic",
      date: new Date("2025-05-20"),
      issuingOrg: "College Board",
      tags: JSON.stringify(["AP", "computer science"]),
      isHighlight: true,
    },
    {
      title: "National Honor Society Inducted",
      description: "Inducted into NHS for academic excellence and community service.",
      category: "leadership",
      date: new Date("2025-02-10"),
      issuingOrg: "National Honor Society",
      tags: JSON.stringify(["leadership", "academics"]),
      isHighlight: false,
    },
    {
      title: "Robotics Club Vice President",
      description: "Elected as VP of the school robotics club. Led a team of 12 students.",
      category: "extracurricular",
      date: new Date("2025-09-01"),
      tags: JSON.stringify(["robotics", "leadership"]),
      isHighlight: false,
    },
    {
      title: "Community Service — 100 Hours",
      description: "Completed 100 hours of community service tutoring younger students in math.",
      category: "community_service",
      date: new Date("2025-06-15"),
      issuingOrg: "Lincoln High School",
      tags: JSON.stringify(["tutoring", "community"]),
      isHighlight: false,
    },
    {
      title: "Creative Writing Award",
      description: "Won the school creative writing contest with a short story about AI ethics.",
      category: "creative",
      date: new Date("2025-04-22"),
      issuingOrg: "Lincoln High School English Dept",
      tags: JSON.stringify(["writing", "AI"]),
      isHighlight: true,
    },
  ];

  for (const a of achievements) {
    await prisma.achievement.create({
      data: { ...a, userId: user.id },
    });
  }
  console.log(`Created ${achievements.length} achievements`);

  // Grades
  const grades = [
    { subject: "Mathematics", courseName: "AP Calculus BC", grade: "A", credits: 1.0, weight: "ap", semester: "Fall 2025" },
    { subject: "Computer Science", courseName: "AP CS A", grade: "A+", credits: 1.0, weight: "ap", semester: "Fall 2025" },
    { subject: "English", courseName: "Honors English 11", grade: "A-", credits: 1.0, weight: "honors", semester: "Fall 2025" },
    { subject: "Physics", courseName: "AP Physics 1", grade: "B+", credits: 1.0, weight: "ap", semester: "Fall 2025" },
    { subject: "Spanish", courseName: "Spanish III", grade: "A", credits: 1.0, weight: "regular", semester: "Fall 2025" },
    { subject: "History", courseName: "US History", grade: "A-", credits: 1.0, weight: "regular", semester: "Fall 2025" },
  ];

  for (const g of grades) {
    await prisma.grade.create({
      data: { ...g, userId: user.id },
    });
  }
  console.log(`Created ${grades.length} grades`);

  // Goals
  const goals = [
    {
      title: "Maintain 3.8+ GPA",
      description: "Keep my GPA above 3.8 throughout junior year.",
      category: "academic",
      targetDate: new Date("2026-06-01"),
      progress: 75,
      status: "active",
      milestones: JSON.stringify([
        { title: "Complete Fall semester with 3.8+", completed: true },
        { title: "Complete Spring mid-terms above B+", completed: false },
        { title: "Final Spring GPA check", completed: false },
      ]),
    },
    {
      title: "Build a Portfolio Website",
      description: "Create a personal website showcasing my projects and achievements.",
      category: "personal",
      targetDate: new Date("2026-03-01"),
      progress: 40,
      status: "active",
      milestones: JSON.stringify([
        { title: "Design wireframes", completed: true },
        { title: "Set up Next.js project", completed: true },
        { title: "Build homepage and projects page", completed: false },
        { title: "Deploy to Vercel", completed: false },
      ]),
    },
    {
      title: "Complete 50 hours of SAT prep",
      description: "Dedicate focused study time for SAT preparation.",
      category: "academic",
      targetDate: new Date("2026-04-01"),
      progress: 30,
      status: "active",
    },
  ];

  for (const g of goals) {
    await prisma.goal.create({
      data: { ...g, userId: user.id },
    });
  }
  console.log(`Created ${goals.length} goals`);

  // Assignments
  const assignments = [
    {
      title: "Calculus Problem Set #12",
      description: "Chapters 8-9 integration techniques",
      subject: "Mathematics",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      priority: "high",
      status: "in_progress",
    },
    {
      title: "English Essay: AI Ethics",
      description: "5-page argumentative essay on artificial intelligence in education",
      subject: "English",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: "medium",
      status: "todo",
    },
    {
      title: "Physics Lab Report",
      subject: "Physics",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      priority: "urgent",
      status: "todo",
    },
    {
      title: "Spanish Vocab Quiz Prep",
      subject: "Spanish",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      priority: "medium",
      status: "done",
    },
  ];

  for (const a of assignments) {
    await prisma.assignment.create({
      data: { ...a, userId: user.id },
    });
  }
  console.log(`Created ${assignments.length} assignments`);

  // Flashcard Deck
  const deck = await prisma.flashcardDeck.create({
    data: {
      title: "AP Physics Key Concepts",
      description: "Core concepts for AP Physics 1",
      subject: "Physics",
      color: "blue",
      userId: user.id,
      cards: {
        create: [
          { front: "What is Newton's First Law?", back: "An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force." },
          { front: "What is the formula for kinetic energy?", back: "KE = 1/2 mv^2, where m is mass and v is velocity." },
          { front: "What is Ohm's Law?", back: "V = IR, where V is voltage, I is current, and R is resistance." },
          { front: "What is the difference between speed and velocity?", back: "Speed is scalar (magnitude only). Velocity is a vector (magnitude and direction)." },
          { front: "What is conservation of momentum?", back: "In a closed system, the total momentum before a collision equals the total momentum after." },
        ],
      },
    },
  });
  console.log(`Created flashcard deck with 5 cards`);

  // Study Sessions
  const studySessions = [
    { mode: "pomodoro", duration: 25 * 60, subject: "Calculus", completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { mode: "deep_focus", duration: 50 * 60, subject: "Physics", completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { mode: "pomodoro", duration: 25 * 60, subject: "English Essay", completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { mode: "pomodoro", duration: 25 * 60, subject: "Spanish Vocab", completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    { mode: "stopwatch", duration: 40 * 60, subject: "SAT Prep", completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
  ];

  for (const s of studySessions) {
    await prisma.studySession.create({
      data: { ...s, userId: user.id },
    });
  }
  console.log(`Created ${studySessions.length} study sessions`);

  // Notes
  const notes = [
    {
      title: "Calculus Integration Techniques",
      content: "# Integration Techniques\n\n## Substitution\nUse when the integrand contains a composite function.\n\n## Integration by Parts\nFormula: ∫u dv = uv - ∫v du\nChoose u and dv using LIATE:\n- Logarithmic\n- Inverse trig\n- Algebraic\n- Trig\n- Exponential\n\n## Partial Fractions\nDecompose rational functions into simpler fractions.",
      tags: JSON.stringify(["calculus", "math", "AP"]),
      isPinned: true,
    },
    {
      title: "SAT Tips & Strategies",
      content: "# SAT Preparation Notes\n\n- Read the question carefully before looking at answers\n- Process of elimination is your friend\n- Time management: 1.25 min per question on average\n- Always attempt every question (no penalty for wrong answers)\n- Practice with official College Board materials",
      tags: JSON.stringify(["SAT", "test prep"]),
      isPinned: false,
    },
  ];

  for (const n of notes) {
    await prisma.note.create({
      data: { ...n, userId: user.id },
    });
  }
  console.log(`Created ${notes.length} notes`);

  // --- Additional Study Sessions (analytics data) ---
  const additionalSessions = [];
  const subjects = ["Calculus", "Physics", "English", "SAT Prep", "Spanish", "CS Projects", "History"];
  const modes = ["pomodoro", "deep_focus", "stopwatch"];
  for (let i = 0; i < 20; i++) {
    const dayOffset = Math.floor(Math.random() * 14);
    const hour = 14 + Math.floor(Math.random() * 8); // 2pm-10pm
    const d = new Date();
    d.setDate(d.getDate() - dayOffset);
    d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
    additionalSessions.push({
      mode: modes[Math.floor(Math.random() * modes.length)],
      duration: (15 + Math.floor(Math.random() * 75)) * 60,
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      focusScore: 50 + Math.floor(Math.random() * 50),
      completedAt: d,
    });
  }
  for (const s of additionalSessions) {
    await prisma.studySession.create({ data: { ...s, userId: user.id } });
  }
  console.log(`Created ${additionalSessions.length} additional study sessions`);

  // --- Reading Items ---
  const readingItems = [
    { title: "The Great Gatsby", author: "F. Scott Fitzgerald", genre: "Classic Fiction", pageCount: 180, pagesRead: 180, status: "completed", rating: 4, startDate: new Date("2025-09-01"), finishDate: new Date("2025-09-15"), notes: "Amazing prose and symbolism." },
    { title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", genre: "Non-Fiction", pageCount: 464, pagesRead: 210, status: "reading", startDate: new Date("2025-12-01") },
    { title: "The Art of Problem Solving", author: "Richard Rusczyk", genre: "Mathematics", pageCount: 272, pagesRead: 0, status: "to_read" },
  ];
  for (const r of readingItems) {
    await prisma.readingItem.create({ data: { ...r, userId: user.id } });
  }
  console.log(`Created ${readingItems.length} reading items`);

  // --- Mood Entries ---
  const moods = [
    { mood: "GOOD", note: "Productive morning session" },
    { mood: "THRIVING", note: "Aced physics quiz!" },
    { mood: "OKAY", note: "Feeling tired" },
    { mood: "GOOD", note: null },
    { mood: "STRUGGLING", note: "Calculus exam stress" },
    { mood: "GOOD", note: "Good study group" },
    { mood: "THRIVING", note: "Weekend rest helped" },
  ];
  for (let i = 0; i < moods.length; i++) {
    await prisma.moodEntry.create({
      data: { ...moods[i], date: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000), userId: user.id },
    });
  }
  console.log(`Created ${moods.length} mood entries`);

  // --- Habits with Logs ---
  const habitDefs = [
    { title: "Read 30 minutes", emoji: "\u{1F4D6}" },
    { title: "Exercise", emoji: "\u{1F3C3}" },
    { title: "Review flashcards", emoji: "\u{1F0CF}" },
  ];
  for (const h of habitDefs) {
    const habit = await prisma.habit.create({ data: { ...h, userId: user.id } });
    // Create logs for 5-8 of last 10 days
    const logCount = 5 + Math.floor(Math.random() * 4);
    const usedDays = new Set<number>();
    while (usedDays.size < logCount) usedDays.add(Math.floor(Math.random() * 10));
    for (const day of usedDays) {
      const logDate = new Date();
      logDate.setDate(logDate.getDate() - day);
      logDate.setHours(0, 0, 0, 0);
      await prisma.habitLog.create({ data: { habitId: habit.id, date: logDate } });
    }
  }
  console.log(`Created ${habitDefs.length} habits with logs`);

  // --- Exams with Revision Topics ---
  const examDefs = [
    { subject: "AP Calculus BC", date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), location: "Room 204", notes: "Bring calculator", color: "#06b6d4", topics: ["Integration techniques", "Series convergence", "Polar coordinates", "Parametric equations"] },
    { subject: "AP Physics 1", date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), location: "Gymnasium", color: "#8b5cf6", topics: ["Kinematics", "Newton's Laws", "Energy conservation", "Momentum", "Rotational motion"] },
  ];
  for (const e of examDefs) {
    const { topics, ...examData } = e;
    const exam = await prisma.exam.create({ data: { ...examData, userId: user.id } });
    for (let i = 0; i < topics.length; i++) {
      await prisma.revisionTopic.create({ data: { examId: exam.id, topic: topics[i], isComplete: i < 2 } });
    }
  }
  console.log(`Created ${examDefs.length} exams with revision topics`);

  // --- Documents ---
  const docs = [
    { title: "AP Calculus Study Guide", fileName: "calc-study-guide.pdf", fileUrl: "/uploads/demo/calc-study-guide.pdf", fileSize: 2048000, fileType: "application/pdf", category: "essay", folder: "Study Materials" },
    { title: "Science Fair Report", fileName: "science-fair-report.pdf", fileUrl: "/uploads/demo/science-fair-report.pdf", fileSize: 5120000, fileType: "application/pdf", category: "other", folder: "Projects" },
  ];
  for (const d of docs) {
    await prisma.document.create({ data: { ...d, userId: user.id } });
  }
  console.log(`Created ${docs.length} documents`);

  // --- Set XP and username for public profile ---
  await prisma.user.update({
    where: { id: user.id },
    data: {
      xp: 1250,
      level: "Achiever",
      username: "alexj",
      profilePublic: true,
    },
  });
  console.log("Set XP (1250), level (Achiever), username (alexj), profile public");

  console.log("\nSeed completed successfully!");
  console.log("Login with: alex@demo.com / demo123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
