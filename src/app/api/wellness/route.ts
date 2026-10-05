import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const createSchema = z.object({
  mood: z.enum(["THRIVING", "GOOD", "OKAY", "STRUGGLING", "BURNT_OUT"]),
  note: z.string().max(1000).optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 30, 100);

  const entries = await prisma.moodEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: limit,
  });

  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = createSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Invalid input", details: z.treeifyError(result.error) }, { status: 400 });

  const entry = await prisma.moodEntry.create({
    data: { ...result.data, userId: session.user.id },
  });

  return NextResponse.json(entry, { status: 201 });
}
