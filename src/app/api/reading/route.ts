import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  author: z.string().max(200).optional(),
  isbn: z.string().max(20).optional(),
  genre: z.string().max(50).optional(),
  coverUrl: z.string().max(500).optional(),
  pageCount: z.number().int().min(1).optional(),
  pagesRead: z.number().int().min(0).optional(),
  status: z.enum(["to_read", "reading", "completed", "dnf"]).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(2000).optional(),
  startDate: z.string().optional(),
  finishDate: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const items = await prisma.readingItem.findMany({
      where: {
        userId: session.user.id,
        ...(status && status !== "all" ? { status } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("[Reading] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = createSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Invalid input", details: z.treeifyError(result.error) }, { status: 400 });
  }

  try {
    const item = await prisma.readingItem.create({
      data: {
        ...result.data,
        startDate: result.data.startDate ? new Date(result.data.startDate) : undefined,
        finishDate: result.data.finishDate ? new Date(result.data.finishDate) : undefined,
        userId: session.user.id,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("[Reading] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
