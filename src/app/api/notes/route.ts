import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { noteSchema } from "@/lib/validations/note";
import { z } from "zod/v4";
import { toJsonArray } from "@/lib/utils";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag") || "";
    const archived = searchParams.get("archived") === "true";

    const where: Record<string, unknown> = {
      userId: session.user.id,
      isArchived: archived,
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    if (tag) {
      where.tags = { contains: tag };
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      take: 100,
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("[Notes] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = noteSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  try {
    const { tags, ...data } = result.data;

    const note = await prisma.note.create({
      data: {
        ...data,
        tags: tags ? toJsonArray(tags) : null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("[Notes] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
