import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([], { status: 401 });

    const q = req.nextUrl.searchParams.get("q")?.trim()?.slice(0, 200);
    if (!q || q.length < 2) return NextResponse.json([]);

    const userId = session.user.id;

    // Search across multiple models in parallel
    const [achievements, assignments, goals, notes, exams, habits, reading] = await Promise.all([
      prisma.achievement.findMany({
        where: { userId, title: { contains: q } },
        select: { id: true, title: true, category: true },
        take: 5,
      }),
      prisma.assignment.findMany({
        where: { userId, title: { contains: q } },
        select: { id: true, title: true, subject: true },
        take: 5,
      }),
      prisma.goal.findMany({
        where: { userId, title: { contains: q } },
        select: { id: true, title: true, category: true },
        take: 5,
      }),
      prisma.note.findMany({
        where: { userId, OR: [{ title: { contains: q } }, { content: { contains: q } }] },
        select: { id: true, title: true },
        take: 5,
      }),
      prisma.exam.findMany({
        where: { userId, subject: { contains: q } },
        select: { id: true, subject: true, date: true },
        take: 5,
      }),
      prisma.habit.findMany({
        where: { userId, title: { contains: q } },
        select: { id: true, title: true },
        take: 5,
      }),
      prisma.readingItem.findMany({
        where: { userId, OR: [{ title: { contains: q } }, { author: { contains: q } }] },
        select: { id: true, title: true, author: true },
        take: 5,
      }),
    ]);

    const results = [
      ...achievements.map((a) => ({ type: "achievement" as const, id: a.id, title: a.title, subtitle: a.category, href: "/achievements" })),
      ...assignments.map((a) => ({ type: "assignment" as const, id: a.id, title: a.title, subtitle: a.subject, href: "/assignments" })),
      ...goals.map((g) => ({ type: "goal" as const, id: g.id, title: g.title, subtitle: g.category, href: "/goals" })),
      ...notes.map((n) => ({ type: "note" as const, id: n.id, title: n.title, subtitle: null, href: `/study/notes/${n.id}` })),
      ...exams.map((e) => ({ type: "exam" as const, id: e.id, title: e.subject, subtitle: new Date(e.date).toLocaleDateString(), href: "/exams" })),
      ...habits.map((h) => ({ type: "habit" as const, id: h.id, title: h.title, subtitle: null, href: "/habits" })),
      ...reading.map((r) => ({ type: "book" as const, id: r.id, title: r.title, subtitle: r.author, href: "/reading" })),
    ];

    return NextResponse.json(results.slice(0, 20));
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
