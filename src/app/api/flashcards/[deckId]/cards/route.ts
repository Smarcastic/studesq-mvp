import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cardSchema } from "@/lib/validations/flashcard";
import { z } from "zod/v4";

export async function POST(req: Request, { params }: { params: Promise<{ deckId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { deckId } = await params;

  // Verify ownership
  const deck = await prisma.flashcardDeck.findFirst({
    where: { id: deckId, userId: session.user.id },
  });
  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  const body = await req.json();
  const result = cardSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  const card = await prisma.flashcard.create({
    data: {
      ...result.data,
      deckId,
    },
  });

  return NextResponse.json(card, { status: 201 });
}
