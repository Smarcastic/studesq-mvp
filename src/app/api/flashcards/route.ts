import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deckSchema } from "@/lib/validations/flashcard";
import { z } from "zod/v4";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decks = await prisma.flashcardDeck.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { cards: true } },
      cards: {
        where: { nextReview: { lte: new Date() } },
        select: { id: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const result = decks.map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    subject: d.subject,
    color: d.color,
    cardCount: d._count.cards,
    dueCount: d.cards.length,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = deckSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  const deck = await prisma.flashcardDeck.create({
    data: {
      ...result.data,
      userId: session.user.id,
    },
  });

  return NextResponse.json(deck, { status: 201 });
}
