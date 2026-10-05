"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useAutoSave } from "@/hooks/use-auto-save";
import { parseJsonArray } from "@/lib/utils";
import { RichEditor } from "@/components/study/notes/rich-editor";
import { generateFlashcardsFromNotes, type GeneratedFlashcard } from "@/lib/ai-engine";
import { ArrowLeft, Save, Pin, X, Check, Zap, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function NoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Flashcard generation state
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedFlashcard[]>([]);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);

  const { data: note, isLoading } = useQuery({
    queryKey: ["note", id],
    queryFn: () => fetch(`/api/notes/${id}`).then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); }),
  });

  // Initialize state from fetched note
  useEffect(() => {
    if (note && !initialized) {
      setTitle(note.title || "");
      setContent(note.content || "");
      setTags(parseJsonArray(note.tags));
      setIsPinned(note.isPinned || false);
      setInitialized(true);
    }
  }, [note, initialized]);

  const saveFn = useCallback(async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, tags, isPinned }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    } catch {
      toast("Failed to save note", "error");
    } finally {
      setSaving(false);
    }
  }, [id, title, content, tags, isPinned, hasChanges, queryClient, toast]);

  const { triggerSave, saveNow } = useAutoSave(saveFn, 2000);

  const handleChange = () => {
    setHasChanges(true);
    triggerSave();
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
      handleChange();
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    handleChange();
  };

  const handleGenerateFlashcards = () => {
    // Strip HTML tags to get plain text
    const plainText = content
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();

    if (plainText.length < 20) {
      toast("Add more content to your note first!", "error");
      return;
    }

    const subject = note?.subject ?? (tags[0] ?? undefined);
    const cards = generateFlashcardsFromNotes(plainText, subject);

    if (cards.length === 0) {
      toast("No flashcard patterns found. Try adding definitions or key terms.", "error");
      return;
    }

    setGeneratedCards(cards);
    setPreviewIdx(0);
    setShowFlashcardModal(true);
  };

  const handleCreateDeck = async () => {
    setIsCreatingDeck(true);
    try {
      // 1. Create the deck
      const deckRes = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${title || "Untitled Note"} — Flashcards`,
          description: `Auto-generated from note: ${title}`,
          subject: note?.subject ?? tags[0] ?? undefined,
          color: "teal",
        }),
      });
      if (!deckRes.ok) throw new Error("Failed to create deck");
      const deck = await deckRes.json();

      // 2. Add all cards
      await Promise.all(
        generatedCards.map((card) =>
          fetch(`/api/flashcards/${deck.id}/cards`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ front: card.front, back: card.back }),
          })
        )
      );

      toast(`Created deck with ${generatedCards.length} flashcards!`);
      setShowFlashcardModal(false);
      queryClient.invalidateQueries({ queryKey: ["flashcard-decks"] });
      router.push(`/study/flashcards/${deck.id}`);
    } catch {
      toast("Failed to create deck", "error");
    } finally {
      setIsCreatingDeck(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!note || note.error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Note not found.</p>
        <Link href="/study/notes">
          <Button variant="outline" size="sm" className="mt-4">
            <ArrowLeft className="h-4 w-4" /> Back to Notes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/study/notes" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Notes
        </Link>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-xs text-gray-400">Unsaved changes</span>
          )}
          {saving && (
            <span className="text-xs text-primary-500 flex items-center gap-1">
              <div className="h-3 w-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          )}
          {!hasChanges && !saving && initialized && (
            <span className="text-xs text-success flex items-center gap-1">
              <Check className="h-3 w-3" /> Saved
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateFlashcards}
            className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
          >
            <Zap className="h-4 w-4" /> Flashcards
          </Button>
          <Button
            size="sm"
            variant={isPinned ? "primary" : "outline"}
            onClick={() => {
              setIsPinned(!isPinned);
              handleChange();
            }}
          >
            <Pin className="h-4 w-4" /> {isPinned ? "Pinned" : "Pin"}
          </Button>
          <Button size="sm" onClick={saveNow} disabled={!hasChanges} loading={saving}>
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
      </div>

      <Card padding="none">
        <div className="p-6 pb-0">
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); handleChange(); }}
            placeholder="Note title..."
            className="w-full text-2xl font-bold bg-transparent border-0 outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
          />
        </div>

        <div className="px-6 py-3 flex flex-wrap items-center gap-2 border-b border-gray-100 dark:border-dark-border">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-primary-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            placeholder="Add tag..."
            className="text-xs bg-transparent border-0 outline-none w-24 placeholder:text-gray-400"
          />
        </div>

        {initialized && (
          <RichEditor
            content={content}
            onUpdate={(html) => {
              setContent(html);
              handleChange();
            }}
            placeholder="Start writing..."
          />
        )}
      </Card>

      {/* Flashcard Generation Modal */}
      {showFlashcardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            className="w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-normal)" }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50">
                  <Zap className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                    AI Flashcards Generated
                  </h2>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {generatedCards.length} cards from your note
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFlashcardModal(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-slate-100"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Card Preview */}
            <div className="px-6 py-5">
              <p className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>
                Preview — card {previewIdx + 1} of {generatedCards.length}
              </p>
              <div
                className="rounded-xl border p-4 min-h-[120px] space-y-3"
                style={{ borderColor: "var(--border-subtle)", background: "var(--bg-elevated)" }}
              >
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold mb-1 text-amber-600">Front</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {generatedCards[previewIdx]?.front}
                  </p>
                </div>
                <div className="border-t pt-3" style={{ borderColor: "var(--border-subtle)" }}>
                  <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Back</p>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {generatedCards[previewIdx]?.back}
                  </p>
                </div>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={() => setPreviewIdx((i) => Math.max(0, i - 1))}
                  disabled={previewIdx === 0}
                  className="p-1.5 rounded-lg transition-colors disabled:opacity-30 hover:bg-slate-100"
                  style={{ color: "var(--text-muted)" }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex gap-1">
                  {generatedCards.slice(0, 8).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPreviewIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${i === previewIdx ? "w-4 bg-amber-500" : "w-1.5 bg-slate-200"}`}
                    />
                  ))}
                  {generatedCards.length > 8 && (
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>+{generatedCards.length - 8}</span>
                  )}
                </div>
                <button
                  onClick={() => setPreviewIdx((i) => Math.min(generatedCards.length - 1, i + 1))}
                  disabled={previewIdx === generatedCards.length - 1}
                  className="p-1.5 rounded-lg transition-colors disabled:opacity-30 hover:bg-slate-100"
                  style={{ color: "var(--text-muted)" }}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <Button variant="outline" size="sm" onClick={() => setShowFlashcardModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateDeck}
                loading={isCreatingDeck}
                className="gap-1.5"
              >
                <Layers className="h-4 w-4" />
                Create Deck ({generatedCards.length} cards)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
