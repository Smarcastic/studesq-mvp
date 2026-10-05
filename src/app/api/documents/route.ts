import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  fileName: z.string().min(1).max(200),
  fileUrl: z.string().min(1).max(500),
  fileSize: z.number().int().optional(),
  fileType: z.string().max(100).optional(),
  category: z.enum(["transcript", "certificate", "essay", "other"]).optional(),
  tags: z.string().optional(),
  folder: z.string().max(100).optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const docs = await prisma.document.findMany({
      where: {
        userId: session.user.id,
        ...(category && category !== "all" ? { category } : {}),
        ...(search ? { title: { contains: search } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(docs);
  } catch (error) {
    console.error("[Documents] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = createSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Invalid input", details: z.treeifyError(result.error) }, { status: 400 });

  try {
    const doc = await prisma.document.create({
      data: { ...result.data, userId: session.user.id },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("[Documents] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
