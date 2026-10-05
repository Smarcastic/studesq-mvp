import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");

  try {
    const userId = session.user.id;

    const where: Record<string, unknown> = { userId };
    if (year) {
      const start = new Date(`${year}-01-01`);
      const end = new Date(`${Number(year) + 1}-01-01`);
      where.date = { gte: start, lt: end };
    }

    const achievements = await prisma.achievement.findMany({
      where,
      orderBy: { date: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        date: true,
        issuingOrg: true,
        isHighlight: true,
      },
    });

    // Group by month
    const grouped: Record<string, typeof achievements> = {};
    for (const a of achievements) {
      const d = new Date(a.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(a);
    }

    // Get all years that have achievements
    const years = await prisma.achievement.findMany({
      where: { userId },
      select: { date: true },
      distinct: ["date"],
    });

    const uniqueYears = [...new Set(years.map((y) => new Date(y.date).getFullYear()))].sort((a, b) => b - a);

    return NextResponse.json({ grouped, years: uniqueYears });
  } catch (error) {
    console.error("Timeline API error:", error);
    return NextResponse.json({ error: "Failed to load timeline" }, { status: 500 });
  }
}
