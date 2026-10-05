import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  author: z.string().max(200).optional(),
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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const result = updateSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Invalid input", details: z.treeifyError(result.error) }, { status: 400 });

  const existing = await prisma.readingItem.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const item = await prisma.readingItem.update({
    where: { id },
    data: {
      ...result.data,
      startDate: result.data.startDate ? new Date(result.data.startDate) : undefined,
      finishDate: result.data.finishDate ? new Date(result.data.finishDate) : undefined,
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.readingItem.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.readingItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
