import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deckSchema } from "@/lib/validations/flashcard";
import { z } from "zod/v4";

export async function GET(_req: Request, { params }: { params: Promise<{ deckId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { deckId } = await params;

  const deck = await prisma.flashcardDeck.findFirst({
    where: { id: deckId, userId: session.user.id },
    include: {
      cards: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!deck) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(deck);
}

export async function PUT(req: Request, { params }: { params: Promise<{ deckId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { deckId } = await params;
  const body = await req.json();
  const result = deckSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  const existing = await prisma.flashcardDeck.findFirst({
    where: { id: deckId, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const deck = await prisma.flashcardDeck.update({
    where: { id: deckId },
    data: result.data,
  });

  return NextResponse.json(deck);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ deckId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { deckId } = await params;

  const existing = await prisma.flashcardDeck.findFirst({
    where: { id: deckId, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.flashcardDeck.delete({ where: { id: deckId } });

  return NextResponse.json({ success: true });
}
