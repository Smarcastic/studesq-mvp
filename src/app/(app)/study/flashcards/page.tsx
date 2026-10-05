"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deckColors, type DeckInput } from "@/lib/validations/flashcard";
import { Plus, BookOpen, Layers, Trash2, Play } from "lucide-react";
import Link from "next/link";

interface Deck {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  color?: string;
  cardCount: number;
  dueCount: number;
  updatedAt: string;
}

export default function FlashcardsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [color, setColor] = useState("teal");

  const { data: decks, isLoading } = useQuery<Deck[]>({
    queryKey: ["flashcard-decks"],
    queryFn: () => fetch("/api/flashcards").then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); }),
  });

  const createMutation = useMutation({
    mutationFn: (data: DeckInput) =>
      fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create deck");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcard-decks"] });
      toast("Deck created!");
      resetForm();
    },
    onError: () => toast("Failed to create deck", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/flashcards/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcard-decks"] });
      toast("Deck deleted");
    },
    onError: () => toast("Failed to delete deck", "error"),
  });

  const resetForm = () => {
    setShowCreate(false);
    setTitle("");
    setDescription("");
    setSubject("");
    setColor("teal");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      subject: subject.trim() || undefined,
      color,
    });
  };

  const getColorClass = (c?: string) => {
    const found = deckColors.find((dc) => dc.value === c);
    return found?.class || "bg-teal-500";
  };

  return (
    <div>
      <PageHeader
        title="Flashcards"
        description="Create and study flashcard decks."
        action={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> New Deck
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : decks && decks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <Card key={deck.id} hover className="relative group">
              <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl ${getColorClass(deck.color)}`} />
              <div className="pt-2">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/study/flashcards/${deck.id}`} className="font-semibold hover:text-primary-500 transition-colors">
                      {deck.title}
                    </Link>
                    {deck.subject && (
                      <Badge variant="default" className="mt-1 block w-fit">{deck.subject}</Badge>
                    )}
                  </div>
                  <button
                    onClick={() => setDeleteTarget(deck.id)}
                    className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {deck.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{deck.description}</p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-gray-500">
                    <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {deck.cardCount} cards</span>
                    {deck.dueCount > 0 && (
                      <Badge variant="warning">{deck.dueCount} due</Badge>
                    )}
                  </div>
                  <Link href={`/study/flashcards/${deck.id}`}>
                    <Button size="sm" variant="ghost">
                      <Play className="h-3.5 w-3.5" /> Study
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="No flashcard decks yet"
          description="Create your first deck to start studying."
          action={
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> New Deck
            </Button>
          }
        />
      )}

      <Modal open={showCreate} onClose={resetForm} title="New Flashcard Deck">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="deck-title"
            label="Deck Title"
            placeholder="e.g., Biology Chapter 5"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Textarea
            id="deck-desc"
            label="Description (optional)"
            placeholder="What's this deck about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            id="deck-subject"
            label="Subject (optional)"
            placeholder="e.g., Biology"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
            <div className="flex gap-2">
              {deckColors.map((dc) => (
                <button
                  key={dc.value}
                  type="button"
                  onClick={() => setColor(dc.value)}
                  className={`w-8 h-8 rounded-full ${dc.class} transition-all ${
                    color === dc.value ? "ring-2 ring-offset-2 ring-gray-400" : "hover:scale-110"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create Deck</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        title="Delete deck?"
        description="This will permanently delete this deck and all its cards. This action cannot be undone."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
