"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Flashcard } from "@/components/study/flashcard";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { type CardInput } from "@/lib/validations/flashcard";
import { ArrowLeft, Plus, Trash2, Layers, Pencil, ChevronLeft, ChevronRight, Filter, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface FlashcardData {
  id: string;
  front: string;
  back: string;
  hints?: string;
  nextReview: string;
  reviewCount: number;
  interval: number;
}

interface DeckData {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  color?: string;
  cards: FlashcardData[];
}

export default function DeckStudyPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [mode, setMode] = useState<"overview" | "study">("overview");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [hints, setHints] = useState("");
  const [showDueOnly, setShowDueOnly] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);

  // Edit card state
  const [editCard, setEditCard] = useState<FlashcardData | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [editHints, setEditHints] = useState("");

  // Edit deck state
  const [showEditDeck, setShowEditDeck] = useState(false);
  const [editDeckTitle, setEditDeckTitle] = useState("");
  const [editDeckDesc, setEditDeckDesc] = useState("");

  const { data: deck, isLoading } = useQuery<DeckData>({
    queryKey: ["flashcard-deck", deckId],
    queryFn: () => fetch(`/api/flashcards/${deckId}`).then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); }),
  });

  const addCardMutation = useMutation({
    mutationFn: (data: CardInput) =>
      fetch(`/api/flashcards/${deckId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to add card");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcard-deck", deckId] });
      queryClient.invalidateQueries({ queryKey: ["flashcard-decks"] });
      toast("Card added!");
      setFront("");
      setBack("");
      setHints("");
    },
    onError: () => toast("Failed to add card", "error"),
  });

  const deleteCardMutation = useMutation({
    mutationFn: (cardId: string) =>
      fetch(`/api/flashcards/${deckId}/cards/${cardId}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcard-deck", deckId] });
      queryClient.invalidateQueries({ queryKey: ["flashcard-decks"] });
      toast("Card deleted");
    },
    onError: () => toast("Failed to delete card", "error"),
  });

  const editCardMutation = useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: CardInput }) =>
      fetch(`/api/flashcards/${deckId}/cards/${cardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update card");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcard-deck", deckId] });
      toast("Card updated!");
      setEditCard(null);
    },
    onError: () => toast("Failed to update card", "error"),
  });

  const editDeckMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) =>
      fetch(`/api/flashcards/${deckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update deck");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcard-deck", deckId] });
      queryClient.invalidateQueries({ queryKey: ["flashcard-decks"] });
      toast("Deck updated!");
      setShowEditDeck(false);
    },
    onError: () => toast("Failed to update deck", "error"),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ cardId, difficulty }: { cardId: string; difficulty: "hard" | "good" | "easy" }) =>
      fetch(`/api/flashcards/${deckId}/cards/${cardId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to review");
        return r.json();
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["flashcard-deck", deckId] });
      setReviewFeedback(variables.difficulty);
      setTimeout(() => {
        setReviewFeedback(null);
        nextCard();
      }, 600);
    },
  });

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    addCardMutation.mutate({
      front: front.trim(),
      back: back.trim(),
      hints: hints.trim() || undefined,
    });
  };

  const handleEditCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCard || !editFront.trim() || !editBack.trim()) return;
    editCardMutation.mutate({
      cardId: editCard.id,
      data: { front: editFront.trim(), back: editBack.trim(), hints: editHints.trim() || undefined },
    });
  };

  const handleEditDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDeckTitle.trim()) return;
    editDeckMutation.mutate({
      title: editDeckTitle.trim(),
      description: editDeckDesc.trim() || undefined,
    });
  };

  const openEditCard = (card: FlashcardData) => {
    setEditCard(card);
    setEditFront(card.front);
    setEditBack(card.back);
    setEditHints(card.hints || "");
  };

  const openEditDeck = () => {
    if (!deck) return;
    setEditDeckTitle(deck.title);
    setEditDeckDesc(deck.description || "");
    setShowEditDeck(true);
  };

  const nextCard = useCallback(() => {
    if (deck && currentIndex < deck.cards.length - 1) {
      setCurrentIndex((i) => i + 1);
      setFlipped(false);
    } else {
      setMode("overview");
      setCurrentIndex(0);
      setFlipped(false);
      toast("Study session complete!");
    }
  }, [deck, currentIndex, toast]);

  const prevCard = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setFlipped(false);
    }
  }, [currentIndex]);

  const startStudy = () => {
    setMode("study");
    setCurrentIndex(0);
    setFlipped(false);
  };

  // Keyboard shortcuts for study mode
  useEffect(() => {
    if (mode !== "study" || !deck || deck.cards.length === 0) return;

    const handler = (e: KeyboardEvent) => {
      // Don't capture if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (reviewMutation.isPending || reviewFeedback) return;

      const currentCard = deck.cards[currentIndex];
      if (!currentCard) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (!flipped) setFlipped(true);
          break;
        case "1":
          if (flipped) reviewMutation.mutate({ cardId: currentCard.id, difficulty: "hard" });
          break;
        case "2":
          if (flipped) reviewMutation.mutate({ cardId: currentCard.id, difficulty: "good" });
          break;
        case "3":
          if (flipped) reviewMutation.mutate({ cardId: currentCard.id, difficulty: "easy" });
          break;
        case "ArrowLeft":
          e.preventDefault();
          prevCard();
          break;
        case "ArrowRight":
          e.preventDefault();
          if (!flipped) nextCard();
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, deck, currentIndex, flipped, reviewMutation, reviewFeedback, prevCard, nextCard]);

  // Due card filtering
  const dueCards = deck?.cards.filter((c) => new Date(c.nextReview) <= new Date()) || [];
  const displayCards = showDueOnly ? dueCards : (deck?.cards || []);

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!deck || (deck as { error?: string }).error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Deck not found.</p>
        <Link href="/study/flashcards">
          <Button variant="outline" size="sm" className="mt-4">
            <ArrowLeft className="h-4 w-4" /> Back to Decks
          </Button>
        </Link>
      </div>
    );
  }

  const currentCard = deck.cards[currentIndex];

  if (mode === "study" && deck.cards.length > 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setMode("overview")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <Badge variant="primary">{currentIndex + 1} / {deck.cards.length}</Badge>
        </div>

        <div className="h-80 mb-8 relative">
          <Flashcard
            front={currentCard.front}
            back={currentCard.back}
            hints={currentCard.hints}
            flipped={flipped}
            onFlip={() => setFlipped(!flipped)}
            className="w-full h-full"
          />
          {/* Review feedback overlay */}
          {reviewFeedback && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-emerald-500 text-white rounded-full p-4 animate-scale-in">
                <CheckCircle2 className="h-10 w-10" />
              </div>
            </div>
          )}
        </div>

        {flipped ? (
          <div>
            <div className="flex justify-center gap-3">
              <Button
                variant="danger"
                onClick={() => reviewMutation.mutate({ cardId: currentCard.id, difficulty: "hard" })}
                loading={reviewMutation.isPending}
                disabled={!!reviewFeedback}
              >
                Hard
              </Button>
              <Button
                variant="outline"
                onClick={() => reviewMutation.mutate({ cardId: currentCard.id, difficulty: "good" })}
                loading={reviewMutation.isPending}
                disabled={!!reviewFeedback}
              >
                Good
              </Button>
              <Button
                variant="primary"
                onClick={() => reviewMutation.mutate({ cardId: currentCard.id, difficulty: "easy" })}
                loading={reviewMutation.isPending}
                disabled={!!reviewFeedback}
              >
                Easy
              </Button>
            </div>
            <div className="flex justify-center gap-6 mt-3 text-xs text-gray-400">
              <span>1</span>
              <span>2</span>
              <span>3</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={prevCard} disabled={currentIndex === 0}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button onClick={() => setFlipped(true)}>Show Answer</Button>
              <Button variant="outline" onClick={nextCard}>
                Skip <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">
              Space to flip &middot; Arrow keys to navigate
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/study/flashcards" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Decks
        </Link>
      </div>

      <PageHeader
        title={deck.title}
        description={deck.description || `${deck.cards.length} cards`}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={openEditDeck}>
              <Pencil className="h-4 w-4" /> Edit Deck
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddCard(true)}>
              <Plus className="h-4 w-4" /> Add Card
            </Button>
            {deck.cards.length > 0 && (
              <Button size="sm" onClick={startStudy}>
                Study Now
              </Button>
            )}
          </div>
        }
      />

      {/* Due filter */}
      {deck.cards.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <Button
            size="sm"
            variant={showDueOnly ? "primary" : "outline"}
            onClick={() => setShowDueOnly(!showDueOnly)}
          >
            <Filter className="h-3.5 w-3.5" />
            Due Today ({dueCards.length})
          </Button>
          {showDueOnly && dueCards.length > 0 && (
            <Button size="sm" onClick={() => { setShowDueOnly(false); startStudy(); }}>
              Study Due Cards
            </Button>
          )}
        </div>
      )}

      {displayCards.length > 0 ? (
        <div className="space-y-3">
          {displayCards.map((card, i) => (
            <Card key={card.id} className="!p-4">
              <div className="flex items-start gap-4">
                <div className="text-xs font-medium text-gray-400 mt-1 w-6 text-center">{i + 1}</div>
                <div className="flex-1 min-w-0 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Front</p>
                    <p className="text-sm">{card.front}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Back</p>
                    <p className="text-sm">{card.back}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {card.reviewCount > 0 && (
                    <Badge variant="default">{card.reviewCount} reviews</Badge>
                  )}
                  <button
                    onClick={() => openEditCard(card)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit card"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(card.id)}
                    className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : showDueOnly ? (
        <EmptyState
          icon={<CheckCircle2 className="h-12 w-12" />}
          title="All caught up!"
          description="No cards are due for review right now."
          action={
            <Button size="sm" variant="outline" onClick={() => setShowDueOnly(false)}>
              Show All Cards
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={<Layers className="h-12 w-12" />}
          title="No cards yet"
          description="Add cards to this deck to start studying."
          action={
            <Button size="sm" onClick={() => setShowAddCard(true)}>
              <Plus className="h-4 w-4" /> Add Card
            </Button>
          }
        />
      )}

      {/* Add Card Modal */}
      <Modal open={showAddCard} onClose={() => setShowAddCard(false)} title="Add Flashcard">
        <form onSubmit={handleAddCard} className="space-y-4">
          <Textarea
            id="card-front"
            label="Front (Question)"
            placeholder="What do you want to ask?"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            required
          />
          <Textarea
            id="card-back"
            label="Back (Answer)"
            placeholder="What's the answer?"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            required
          />
          <Input
            id="card-hints"
            label="Hints (optional)"
            placeholder="A little hint to help..."
            value={hints}
            onChange={(e) => setHints(e.target.value)}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddCard(false)}>Cancel</Button>
            <Button type="submit" loading={addCardMutation.isPending}>Add Card</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Card Modal */}
      <Modal open={!!editCard} onClose={() => setEditCard(null)} title="Edit Flashcard">
        <form onSubmit={handleEditCard} className="space-y-4">
          <Textarea
            id="edit-card-front"
            label="Front (Question)"
            placeholder="What do you want to ask?"
            value={editFront}
            onChange={(e) => setEditFront(e.target.value)}
            required
          />
          <Textarea
            id="edit-card-back"
            label="Back (Answer)"
            placeholder="What's the answer?"
            value={editBack}
            onChange={(e) => setEditBack(e.target.value)}
            required
          />
          <Input
            id="edit-card-hints"
            label="Hints (optional)"
            placeholder="A little hint to help..."
            value={editHints}
            onChange={(e) => setEditHints(e.target.value)}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setEditCard(null)}>Cancel</Button>
            <Button type="submit" loading={editCardMutation.isPending}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Deck Modal */}
      <Modal open={showEditDeck} onClose={() => setShowEditDeck(false)} title="Edit Deck">
        <form onSubmit={handleEditDeck} className="space-y-4">
          <Input
            id="edit-deck-title"
            label="Deck Title"
            value={editDeckTitle}
            onChange={(e) => setEditDeckTitle(e.target.value)}
            required
          />
          <Textarea
            id="edit-deck-desc"
            label="Description (optional)"
            value={editDeckDesc}
            onChange={(e) => setEditDeckDesc(e.target.value)}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setShowEditDeck(false)}>Cancel</Button>
            <Button type="submit" loading={editDeckMutation.isPending}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => { if (deleteTarget) deleteCardMutation.mutate(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        title="Delete flashcard?"
        description="This will permanently remove this flashcard. This action cannot be undone."
        loading={deleteCardMutation.isPending}
      />
    </div>
  );
}
