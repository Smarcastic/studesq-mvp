import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const postSchema = z.object({
  userId: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  link: z.string().optional(),
});

// Maps DB notification types to bell component types
function mapDbType(type: string): "overdue" | "assignment" | "exam" | "goal" {
  if (type === "exam_reminder") return "exam";
  if (type === "marketplace_deadline") return "goal";
  if (type === "friend_request" || type === "friend_accepted" || type === "achievement_verified") return "assignment";
  return "assignment";
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const today = new Date(now.setHours(0, 0, 0, 0));

  try {
    const [overdueAssignments, dueSoonAssignments, upcomingExams, recentSessions, savedMarketplace, dbNotifications] = await Promise.all([
      // Overdue assignments
      prisma.assignment.findMany({
        where: {
          userId,
          status: { not: "done" },
          dueDate: { lt: new Date() },
        },
        select: { id: true, title: true, subject: true, dueDate: true, priority: true },
        take: 3,
        orderBy: { dueDate: "asc" },
      }),
      // Assignments due in 48h
      prisma.assignment.findMany({
        where: {
          userId,
          status: { not: "done" },
          dueDate: { gte: new Date(), lte: in48h },
        },
        select: { id: true, title: true, subject: true, dueDate: true, priority: true },
        take: 3,
        orderBy: { dueDate: "asc" },
      }),
      // Exams in 7 days
      prisma.exam.findMany({
        where: {
          userId,
          date: { gte: new Date(), lte: in7d },
        },
        select: { id: true, subject: true, date: true },
        take: 3,
        orderBy: { date: "asc" },
      }),
      // Study sessions today (for streak check)
      prisma.studySession.findMany({
        where: { userId, completedAt: { gte: today } },
        select: { id: true },
        take: 1,
      }),
      // Saved marketplace events with deadline approaching
      prisma.marketplaceSave.findMany({
        where: { userId },
        include: {
          event: {
            select: { id: true, slug: true, title: true, registrationDeadline: true, status: true },
          },
        },
      }),
      // Database-stored notifications (unread)
      prisma.notification.findMany({
        where: { userId, isRead: false },
        select: { id: true, type: true, title: true, body: true, link: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const notifications: {
      id: string;
      type: "overdue" | "assignment" | "exam" | "goal";
      title: string;
      subtitle: string;
      priority: "urgent" | "normal";
      href: string;
    }[] = [];

    // Overdue assignments
    for (const a of overdueAssignments) {
      notifications.push({
        id: `overdue-${a.id}`,
        type: "overdue",
        title: a.title,
        subtitle: `Overdue${a.subject ? ` · ${a.subject}` : ""}`,
        priority: "urgent",
        href: "/assignments",
      });
    }

    // Due soon assignments
    for (const a of dueSoonAssignments) {
      const dueDate = new Date(a.dueDate!);
      const hoursLeft = Math.round((dueDate.getTime() - Date.now()) / (1000 * 60 * 60));
      notifications.push({
        id: `soon-${a.id}`,
        type: "assignment",
        title: a.title,
        subtitle: hoursLeft < 24 ? `Due in ${hoursLeft}h${a.subject ? ` · ${a.subject}` : ""}` : `Due tomorrow${a.subject ? ` · ${a.subject}` : ""}`,
        priority: a.priority === "urgent" || a.priority === "high" ? "urgent" : "normal",
        href: "/assignments",
      });
    }

    // Upcoming exams
    for (const e of upcomingExams) {
      const daysLeft = Math.ceil((new Date(e.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `exam-${e.id}`,
        type: "exam",
        title: `${e.subject} Exam`,
        subtitle: daysLeft === 0 ? "Today!" : daysLeft === 1 ? "Tomorrow!" : `In ${daysLeft} days`,
        priority: daysLeft <= 2 ? "urgent" : "normal",
        href: "/exams",
      });
    }

    // Streak warning (no study today)
    if (recentSessions.length === 0) {
      notifications.push({
        id: "streak-warning",
        type: "goal",
        title: "Streak at risk!",
        subtitle: "You haven't studied today. Start a session to keep your streak.",
        priority: "normal",
        href: "/study/timer",
      });
    }

    // Marketplace deadlines (saved events closing soon)
    for (const save of savedMarketplace) {
      const event = save.event;
      if (event.status !== "APPROVED" || !event.registrationDeadline) continue;
      const deadline = new Date(event.registrationDeadline);
      const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7 && daysLeft >= 0) {
        notifications.push({
          id: `market-${event.id}`,
          type: "goal",
          title: event.title,
          subtitle: daysLeft === 0 ? "Registration closes today!" : `Registration closes in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
          priority: daysLeft <= 2 ? "urgent" : "normal",
          href: `/marketplace/${event.slug}`,
        });
      }
    }

    // DB notifications (friend requests, verifications, etc.)
    for (const n of dbNotifications) {
      notifications.push({
        id: n.id,
        type: mapDbType(n.type),
        title: n.title,
        subtitle: n.body,
        priority: "normal",
        href: n.link ?? "/notifications",
      });
    }

    // Sort: urgent first
    notifications.sort((a, b) => {
      if (a.priority === "urgent" && b.priority !== "urgent") return -1;
      if (b.priority === "urgent" && a.priority !== "urgent") return 1;
      return 0;
    });

    return NextResponse.json(notifications.slice(0, 12));
  } catch (error) {
    console.error("[Notifications] GET error:", error);
    return NextResponse.json([], { status: 200 }); // Fail silently — don't break the header
  }
}

// Internal API — stores a persistent notification in the DB
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = postSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  try {
    const { userId, type, title, body: notifBody, link } = result.data;
    const notification = await prisma.notification.create({
      data: { userId, type, title, body: notifBody, link: link ?? null },
    });
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("[Notifications] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
