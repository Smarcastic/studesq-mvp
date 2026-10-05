import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Fetch all user data in parallel
    const [
      user,
      achievements,
      studySessions,
      assignments,
      goals,
      grades,
      flashcardDecks,
      notes,
      readingItems,
      moodEntries,
      habits,
      exams,
      xpEvents,
      documents,
      collegeApplications,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          bio: true,
          school: true,
          grade: true,
          graduationYear: true,
          location: true,
          interests: true,
          careerAspirations: true,
          languages: true,
          skills: true,
          academicGoals: true,
          xp: true,
          level: true,
          createdAt: true,
        },
      }),
      prisma.achievement.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        select: {
          title: true,
          description: true,
          category: true,
          date: true,
          issuingOrg: true,
          verificationLevel: true,
          createdAt: true,
        },
      }),
      prisma.studySession.findMany({
        where: { userId },
        orderBy: { completedAt: "desc" },
        select: {
          mode: true,
          duration: true,
          subject: true,
          distractions: true,
          focusScore: true,
          mood: true,
          completedAt: true,
        },
      }),
      prisma.assignment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          title: true,
          subject: true,
          description: true,
          dueDate: true,
          priority: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.goal.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          title: true,
          description: true,
          category: true,
          targetDate: true,
          status: true,
          progress: true,
          milestones: true,
          completedAt: true,
          createdAt: true,
        },
      }),
      prisma.grade.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          subject: true,
          courseName: true,
          grade: true,
          credits: true,
          weight: true,
          semester: true,
          year: true,
          createdAt: true,
        },
      }),
      prisma.flashcardDeck.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          cards: {
            select: {
              front: true,
              back: true,
              hints: true,
              interval: true,
              easeFactor: true,
              repetitions: true,
              nextReview: true,
            },
          },
        },
      }),
      prisma.note.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: {
          title: true,
          content: true,
          tags: true,
          isPinned: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.readingItem.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          title: true,
          author: true,
          genre: true,
          pageCount: true,
          pagesRead: true,
          status: true,
          rating: true,
          notes: true,
          quotes: true,
          startDate: true,
          finishDate: true,
          createdAt: true,
        },
      }),
      prisma.moodEntry.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        select: {
          mood: true,
          note: true,
          date: true,
        },
      }),
      prisma.habit.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          logs: {
            select: {
              date: true,
              done: true,
            },
            orderBy: { date: "desc" },
          },
        },
      }),
      prisma.exam.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        select: {
          subject: true,
          date: true,
          location: true,
          notes: true,
          color: true,
          createdAt: true,
        },
      }),
      prisma.xPEvent.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          action: true,
          xp: true,
          createdAt: true,
        },
      }),
      prisma.document.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          title: true,
          fileName: true,
          fileType: true,
          category: true,
          folder: true,
          createdAt: true,
        },
      }),
      prisma.collegeApplication.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          essays: {
            select: {
              prompt: true,
              content: true,
              wordLimit: true,
              wordCount: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      profile: user,
      achievements,
      studySessions,
      assignments,
      goals,
      grades,
      flashcardDecks: flashcardDecks.map((deck) => ({
        title: deck.title,
        description: deck.description,
        subject: deck.subject,
        createdAt: deck.createdAt,
        cards: deck.cards,
      })),
      notes,
      readingItems,
      moodEntries,
      habits: habits.map((habit) => ({
        title: habit.title,
        emoji: habit.emoji,
        createdAt: habit.createdAt,
        logs: habit.logs,
      })),
      exams,
      xpEvents,
      documents,
      collegeApplications: collegeApplications.map((app) => ({
        collegeName: app.collegeName,
        programName: app.programName,
        deadline: app.deadline,
        status: app.status,
        isEarlyDecision: app.isEarlyDecision,
        notes: app.notes,
        createdAt: app.createdAt,
        essays: app.essays,
      })),
    };

    // Return as downloadable JSON file
    const jsonStr = JSON.stringify(exportData, null, 2);
    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="studesq-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Data export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
