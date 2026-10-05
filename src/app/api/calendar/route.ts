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
    const [assignments, exams, goals, applications, savedEvents] = await Promise.all([
      // Assignments with a dueDate
      prisma.assignment.findMany({
        where: { userId, dueDate: { not: null } },
        select: { id: true, title: true, subject: true, dueDate: true, priority: true, status: true },
        orderBy: { dueDate: "asc" },
      }),
      // Exams
      prisma.exam.findMany({
        where: { userId },
        select: { id: true, subject: true, date: true, location: true },
        orderBy: { date: "asc" },
      }),
      // Goals with a targetDate
      prisma.goal.findMany({
        where: { userId, targetDate: { not: null } },
        select: { id: true, title: true, category: true, targetDate: true, status: true },
        orderBy: { targetDate: "asc" },
      }),
      // College applications with a deadline
      prisma.collegeApplication.findMany({
        where: { userId, deadline: { not: null } },
        select: { id: true, collegeName: true, programName: true, deadline: true, status: true },
        orderBy: { deadline: "asc" },
      }),
      // Saved marketplace events with a registration deadline or event start
      prisma.marketplaceSave.findMany({
        where: { userId },
        include: {
          event: {
            select: { id: true, slug: true, title: true, registrationDeadline: true, eventStartDate: true, category: true },
          },
        },
      }),
    ]);

    // Unified event type
    type CalendarEvent = {
      id: string;
      type: "assignment" | "exam" | "goal" | "application" | "marketplace";
      title: string;
      date: string; // ISO string
      subtitle?: string;
      href: string;
      meta?: string; // extra label e.g. priority, status
      isDone?: boolean;
    };

    const events: CalendarEvent[] = [];

    // Assignments
    for (const a of assignments) {
      events.push({
        id: `assignment-${a.id}`,
        type: "assignment",
        title: a.title,
        date: a.dueDate!.toISOString(),
        subtitle: a.subject ?? undefined,
        href: "/assignments",
        meta: a.priority ?? undefined,
        isDone: a.status === "done",
      });
    }

    // Exams
    for (const e of exams) {
      events.push({
        id: `exam-${e.id}`,
        type: "exam",
        title: `${e.subject} Exam`,
        date: e.date.toISOString(),
        subtitle: e.location ?? undefined,
        href: "/exams",
      });
    }

    // Goals — the Goal model uses `status` ("active" | "completed" | "archived"), not a boolean isComplete
    for (const g of goals) {
      events.push({
        id: `goal-${g.id}`,
        type: "goal",
        title: g.title,
        date: g.targetDate!.toISOString(),
        subtitle: g.category ?? undefined,
        href: "/goals",
        isDone: g.status === "completed",
      });
    }

    // College applications
    for (const a of applications) {
      events.push({
        id: `app-${a.id}`,
        type: "application",
        title: a.collegeName,
        date: a.deadline!.toISOString(),
        subtitle: a.programName ?? undefined,
        href: "/applications",
        meta: a.status ?? undefined,
      });
    }

    // Saved marketplace events — registration deadline
    for (const save of savedEvents) {
      const ev = save.event;
      if (ev.registrationDeadline) {
        events.push({
          id: `market-deadline-${ev.id}`,
          type: "marketplace",
          title: ev.title,
          date: ev.registrationDeadline.toISOString(),
          subtitle: "Registration deadline",
          href: `/marketplace/${ev.slug}`,
          meta: ev.category,
        });
      }
      if (ev.eventStartDate) {
        events.push({
          id: `market-start-${ev.id}`,
          type: "marketplace",
          title: ev.title,
          date: ev.eventStartDate.toISOString(),
          subtitle: "Event starts",
          href: `/marketplace/${ev.slug}`,
          meta: ev.category,
        });
      }
    }

    // Sort all by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(events);
  } catch (error) {
    console.error("[Calendar] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
