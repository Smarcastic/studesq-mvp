import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cardSchema } from "@/lib/validations/flashcard";
import { z } from "zod/v4";

export async function PUT(req: Request, { params }: { params: Promise<{ deckId: string; cardId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { deckId, cardId } = await params;

  // Verify deck ownership
  const deck = await prisma.flashcardDeck.findFirst({
    where: { id: deckId, userId: session.user.id },
  });
  if (!deck) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Verify card belongs to this deck
  const existing = await prisma.flashcard.findFirst({
    where: { id: cardId, deckId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Card not found in this deck" }, { status: 404 });
  }

  const body = await req.json();
  const result = cardSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  try {
    const card = await prisma.flashcard.update({
      where: { id: cardId },
      data: result.data,
    });
    return NextResponse.json(card);
  } catch (error) {
    console.error("[Flashcard] PUT error:", error);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ deckId: string; cardId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { deckId, cardId } = await params;

  const deck = await prisma.flashcardDeck.findFirst({
    where: { id: deckId, userId: session.user.id },
  });
  if (!deck) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Verify card belongs to this deck
  const existing = await prisma.flashcard.findFirst({
    where: { id: cardId, deckId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Card not found in this deck" }, { status: 404 });
  }

  try {
    await prisma.flashcard.delete({ where: { id: cardId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Flashcard] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete card" }, { status: 500 });
  }
}
