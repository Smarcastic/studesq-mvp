import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validations/flashcard";
import { calculateSM2, difficultyToQuality } from "@/lib/spaced-repetition";
import { z } from "zod/v4";

export async function POST(req: Request, { params }: { params: Promise<{ deckId: string; cardId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { deckId, cardId } = await params;

  // Verify ownership
  const deck = await prisma.flashcardDeck.findFirst({
    where: { id: deckId, userId: session.user.id },
  });
  if (!deck) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const result = reviewSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  const card = await prisma.flashcard.findUnique({ where: { id: cardId } });
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const quality = difficultyToQuality(result.data.difficulty);
  const sm2Result = calculateSM2({
    quality,
    repetitions: card.repetitions,
    easeFactor: card.easeFactor,
    interval: card.interval,
  });

  const updated = await prisma.flashcard.update({
    where: { id: cardId },
    data: {
      repetitions: sm2Result.repetitions,
      easeFactor: sm2Result.easeFactor,
      interval: sm2Result.interval,
      nextReview: sm2Result.nextReview,
      lastReview: new Date(),
      reviewCount: card.reviewCount + 1,
    },
  });

  return NextResponse.json(updated);
}
