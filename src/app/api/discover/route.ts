import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

const userSelect = {
  id: true,
  name: true,
  username: true,
  image: true,
  school: true,
  grade: true,
  bio: true,
  level: true,
} as const;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const school = searchParams.get("school") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const skip = (page - 1) * PAGE_SIZE;
    const userId = session.user.id;

    // Get current user's school for same-school visibility
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { school: true },
    });

    // Build where conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      id: { not: userId },
      OR: [
        { profilePublic: true },
        // Users from the same school are visible even if profile is not public
        ...(currentUser?.school
          ? [{ school: currentUser.school }]
          : []),
      ],
    };

    // Search filter
    if (q) {
      where.AND = [
        {
          OR: [
            { name: { contains: q } },
            { username: { contains: q } },
          ],
        },
      ];
    }

    // School filter
    if (school) {
      where.school = school;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        skip,
        take: PAGE_SIZE,
        orderBy: { name: "asc" },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total });
  } catch (error) {
    console.error("Discover GET error:", error);
    return NextResponse.json(
      { error: "Failed to discover users" },
      { status: 500 }
    );
  }
}
