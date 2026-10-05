import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1),
  organizerName: z.string().min(1).max(200),
  description: z.string().min(1),
  organizerType: z.string().optional(),
  longDescription: z.string().optional(),
  coverImageUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
  registrationUrl: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  isOnline: z.boolean().optional(),
  isHybrid: z.boolean().optional(),
  eventStartDate: z.string().optional(),
  eventEndDate: z.string().optional(),
  registrationDeadline: z.string().optional(),
  fee: z.number().int().nonnegative().nullable().optional(),
  feeWaiversAvailable: z.boolean().optional(),
  minGrade: z.number().int().min(1).max(14).nullable().optional(),
  maxGrade: z.number().int().min(1).max(14).nullable().optional(),
  minAge: z.number().int().nonnegative().nullable().optional(),
  maxAge: z.number().int().nonnegative().nullable().optional(),
  eligibleBoards: z.string().optional(),
  teamSize: z.string().optional(),
  teamMinSize: z.number().int().nonnegative().nullable().optional(),
  teamMaxSize: z.number().int().nonnegative().nullable().optional(),
  difficulty: z.string().optional(),
  tags: z.string().optional(),
  prizePool: z.number().int().nonnegative().nullable().optional(),
  awardsDescription: z.string().optional(),
  participantCount: z.number().int().nonnegative().nullable().optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.string().optional(),
});

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

const EVENT_SELECT = {
  id: true,
  slug: true,
  title: true,
  category: true,
  organizerName: true,
  organizerType: true,
  description: true,
  coverImageUrl: true,
  city: true,
  state: true,
  isOnline: true,
  isHybrid: true,
  eventStartDate: true,
  eventEndDate: true,
  registrationDeadline: true,
  fee: true,
  feeWaiversAvailable: true,
  minGrade: true,
  maxGrade: true,
  difficulty: true,
  teamSize: true,
  tags: true,
  prizePool: true,
  isVerified: true,
  isFeatured: true,
  isRecurring: true,
  viewCount: true,
  saveCount: true,
  _count: { select: { saves: true, applications: true } },
} as const;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const categoryParam = searchParams.get("category");
    const state = searchParams.get("state");
    const isOnlineParam = searchParams.get("isOnline");
    const isFreeParam = searchParams.get("isFree");
    const difficulty = searchParams.get("difficulty");
    const teamSize = searchParams.get("teamSize");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { status: "APPROVED" };

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { organizerName: { contains: q } },
        { tags: { contains: q } },
      ];
    }

    if (categoryParam) {
      const categories = categoryParam.split(",").map((c) => c.trim()).filter(Boolean);
      if (categories.length > 0) {
        where.category = { in: categories };
      }
    }

    if (state) {
      where.state = state;
    }

    if (isOnlineParam === "true") {
      where.isOnline = true;
    }

    if (isFreeParam === "true") {
      where.fee = null;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (teamSize) {
      where.teamSize = teamSize;
    }

    // Count + fetch with sort: registrationDeadline ASC (nulls last), isFeatured DESC, createdAt DESC
    const [total, events] = await Promise.all([
      prisma.marketplaceEvent.count({ where }),
      prisma.marketplaceEvent.findMany({
        where,
        select: EVENT_SELECT,
        orderBy: [
          { registrationDeadline: "asc" },
          { isFeatured: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
    ]);

    // Check which events the current user has saved
    const savedRecords = await prisma.marketplaceSave.findMany({
      where: { userId: session.user.id },
      select: { eventId: true },
    });
    const savedEventIds = savedRecords.map((s) => s.eventId);

    // SQLite sorts NULLs first with ASC, so we move null-deadline events to end client-side
    const sorted = [...events].sort((a, b) => {
      const aD = a.registrationDeadline;
      const bD = b.registrationDeadline;
      if (!aD && !bD) return 0;
      if (!aD) return 1; // a is null, goes to end
      if (!bD) return -1; // b is null, goes to end
      return new Date(aD).getTime() - new Date(bD).getTime();
    });

    return NextResponse.json({
      events: sorted,
      total,
      page,
      hasMore: skip + events.length < total,
      savedEventIds,
    });
  } catch (error) {
    console.error("[Marketplace] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = createEventSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  try {
    const {
      title,
      eventStartDate,
      eventEndDate,
      registrationDeadline,
      ...rest
    } = result.data;

    // Generate unique slug
    let slug = generateSlug(title);
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.marketplaceEvent.findUnique({ where: { slug } });
      if (!existing) break;
      slug = generateSlug(title);
      attempts++;
    }

    const event = await prisma.marketplaceEvent.create({
      data: {
        ...rest,
        title,
        slug,
        status: "PENDING",
        submittedBy: session.user.id,
        eventStartDate: eventStartDate ? new Date(eventStartDate) : undefined,
        eventEndDate: eventEndDate ? new Date(eventEndDate) : undefined,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("[Marketplace] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
