import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "xp"; // xp | achievements | trust
  const scope = searchParams.get("scope") ?? "global"; // global | school

  // Determine sort field
  let orderBy: Record<string, "desc"> = { xp: "desc" };
  if (category === "achievements") orderBy = { verifiedAchievementsCount: "desc" };
  else if (category === "trust") orderBy = { trustScore: "desc" };

  // Get current user's school for filtering
  let schoolFilter: Record<string, string> | undefined;
  if (scope === "school") {
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { school: true },
    });
    if (me?.school) {
      schoolFilter = { school: me.school };
    }
  }

  try {
    // Fetch top 50 users
    const users = await prisma.user.findMany({
      where: {
        username: { not: null },
        ...(schoolFilter ?? {}),
      },
      orderBy,
      take: 50,
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        school: true,
        grade: true,
        level: true,
        xp: true,
        verifiedAchievementsCount: true,
        trustScore: true,
      },
    });

    // Add rank and isCurrentUser flag
    const ranked = users.map((u, i) => ({
      ...u,
      rank: i + 1,
      isCurrentUser: u.id === session.user.id,
    }));

    // If current user is not in top 50, compute their rank and append
    const inList = ranked.some((u) => u.isCurrentUser);
    if (!inList) {
      // Count how many users rank above the current user
      const me = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          school: true,
          grade: true,
          level: true,
          xp: true,
          verifiedAchievementsCount: true,
          trustScore: true,
        },
      });

      if (me && me.username) {
        const statValue =
          category === "achievements"
            ? me.verifiedAchievementsCount
            : category === "trust"
            ? me.trustScore
            : me.xp;

        const aboveCount = await prisma.user.count({
          where: {
            username: { not: null },
            ...(schoolFilter ?? {}),
            ...(category === "achievements"
              ? { verifiedAchievementsCount: { gt: statValue } }
              : category === "trust"
              ? { trustScore: { gt: statValue } }
              : { xp: { gt: statValue } }),
          },
        });

        ranked.push({
          ...me,
          rank: aboveCount + 1,
          isCurrentUser: true,
        });
      }
    }

    return NextResponse.json(ranked);
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
