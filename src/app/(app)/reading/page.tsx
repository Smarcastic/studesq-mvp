"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FadeUp } from "@/components/ui/motion";
import {
  Plus,
  BookOpen,
  Trash2,
  Star,
  Minus,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types & schema
// ---------------------------------------------------------------------------

interface ReadingItem {
  id: string;
  title: string;
  author?: string;
  genre?: string;
  coverUrl?: string;
  pageCount?: number;
  pagesRead: number;
  status: "to_read" | "reading" | "completed" | "dnf";
  rating?: number;
  notes?: string;
  startDate?: string;
  finishDate?: string;
  createdAt: string;
}

const bookSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  author: z.string().max(200).optional(),
  genre: z.string().max(50).optional(),
  pageCount: z.number().int().min(1).optional(),
  status: z.enum(["to_read", "reading", "completed", "dnf"]).optional(),
});

type BookInput = z.infer<typeof bookSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<ReadingItem["status"], string> = {
  to_read: "To Read",
  reading: "Reading",
  completed: "Completed",
  dnf: "DNF",
};

const STATUS_BADGE_VARIANT: Record<
  ReadingItem["status"],
  "default" | "primary" | "teal" | "success" | "warning" | "error" | "info" | "secondary"
> = {
  to_read: "default",
  reading: "teal",
  completed: "success",
  dnf: "error",
};

const statusOptions = [
  { value: "to_read", label: "To Read" },
  { value: "reading", label: "Reading" },
  { value: "completed", label: "Completed" },
  { value: "dnf", label: "Did Not Finish" },
];

const filterTabs = [
  { id: "all", label: "All" },
  { id: "to_read", label: "To Read" },
  { id: "reading", label: "Reading" },
  { id: "completed", label: "Completed" },
  { id: "dnf", label: "DNF" },
];

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star === value ? 0 : star)}
          className={`p-0 ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
        >
          <Star
            className={`h-4 w-4 ${
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ReadingPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // ---- Data fetching -------------------------------------------------------

  const { data: books, isLoading } = useQuery<ReadingItem[]>({
    queryKey: ["reading", statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      return fetch(`/api/reading?${params}`).then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); });
    },
  });

  // ---- Mutations -----------------------------------------------------------

  const createMutation = useMutation({
    mutationFn: (data: BookInput) =>
      fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading"] });
      toast("Book added to your list!");
      setShowAddModal(false);
      reset();
    },
    onError: () => toast("Failed to add book", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ReadingItem>;
    }) =>
      fetch(`/api/reading/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading"] });
    },
    onError: () => toast("Failed to update book", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/reading/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading"] });
      toast("Book removed from your list");
    },
    onError: () => toast("Failed to delete book", "error"),
  });

  // ---- Form ----------------------------------------------------------------

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookInput>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      author: "",
      genre: "",
      pageCount: undefined,
      status: "to_read",
    },
  });

  // ---- Inline progress update ----------------------------------------------

  const handleProgressChange = (book: ReadingItem, newPagesRead: number) => {
    const clamped = Math.max(0, Math.min(newPagesRead, book.pageCount ?? 9999));
    const autoStatus =
      book.pageCount && clamped >= book.pageCount ? "completed" : undefined;
    updateMutation.mutate({
      id: book.id,
      data: {
        pagesRead: clamped,
        ...(autoStatus ? { status: autoStatus } : {}),
      },
    });
  };

  const handleRatingChange = (book: ReadingItem, rating: number) => {
    updateMutation.mutate({
      id: book.id,
      data: { rating: rating || undefined },
    });
  };

  // ---- Render --------------------------------------------------------------

  return (
    <div>
      <PageHeader
        title="Reading"
        description="Track your reading list and progress."
        action={
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" /> Add Book
          </Button>
        }
      />

      <Tabs
        tabs={filterTabs}
        activeTab={statusFilter}
        onChange={setStatusFilter}
        className="mb-6"
      />

      <FadeUp>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-[14px]" />
            ))}
          </div>
        ) : books && books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {books.map((book) => {
              const isExpanded = expandedCardId === book.id;
              const progressPct =
                book.pageCount && book.pageCount > 0
                  ? Math.round((book.pagesRead / book.pageCount) * 100)
                  : 0;

              return (
                <Card key={book.id} className="relative group">
                  {/* Delete button on hover */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(book.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove book"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Card content — click to expand */}
                  <div
                    className="cursor-pointer"
                    onClick={() =>
                      setExpandedCardId(isExpanded ? null : book.id)
                    }
                  >
                    {/* Title & author */}
                    <div className="flex items-start gap-3 mb-3 pr-8">
                      {book.coverUrl ? (
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-10 h-14 rounded-md object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-14 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                          <BookOpen className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {book.title}
                        </h3>
                        {book.author && (
                          <p className="text-sm text-slate-500 truncate">
                            {book.author}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant={STATUS_BADGE_VARIANT[book.status]}>
                        {STATUS_LABELS[book.status]}
                      </Badge>
                      {book.genre && (
                        <Badge variant="default">{book.genre}</Badge>
                      )}
                    </div>

                    {/* Progress bar */}
                    {book.pageCount && book.pageCount > 0 && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>
                            {book.pagesRead} / {book.pageCount} pages
                          </span>
                          <span>{progressPct}%</span>
                        </div>
                        <Progress
                          value={progressPct}
                          size="sm"
                          color={
                            book.status === "completed" ? "success" : "primary"
                          }
                        />
                      </div>
                    )}

                    {/* Star rating display */}
                    {book.rating && book.rating > 0 && (
                      <div className="mt-2">
                        <StarRating value={book.rating} readonly />
                      </div>
                    )}
                  </div>

                  {/* Expanded inline editor */}
                  {isExpanded && (
                    <div
                      className="mt-4 pt-4 border-t border-slate-100 space-y-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Pages read update */}
                      {book.pageCount && book.pageCount > 0 && (
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1.5">
                            Update Progress
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleProgressChange(
                                  book,
                                  book.pagesRead - 10
                                )
                              }
                              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <input
                              type="range"
                              min={0}
                              max={book.pageCount}
                              value={book.pagesRead}
                              onChange={(e) =>
                                handleProgressChange(
                                  book,
                                  parseInt(e.target.value, 10)
                                )
                              }
                              className="flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-cyan-500"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleProgressChange(
                                  book,
                                  book.pagesRead + 10
                                )
                              }
                              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={book.pageCount}
                              value={book.pagesRead}
                              onChange={(e) =>
                                handleProgressChange(
                                  book,
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              className="w-16 text-center text-sm border border-slate-200 rounded-lg py-1 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            />
                          </div>
                        </div>
                      )}

                      {/* Rating update */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">
                          Rating
                        </label>
                        <StarRating
                          value={book.rating ?? 0}
                          onChange={(v) => handleRatingChange(book, v)}
                        />
                      </div>

                      {/* Status update */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">
                          Status
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {statusOptions.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                updateMutation.mutate({
                                  id: book.id,
                                  data: {
                                    status: opt.value as ReadingItem["status"],
                                  },
                                })
                              }
                              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                book.status === opt.value
                                  ? "bg-cyan-50 border-cyan-300 text-cyan-700"
                                  : "border-slate-200 text-slate-500 hover:border-slate-300"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={<BookOpen className="h-12 w-12" />}
              title="No books yet"
              description="Start building your reading list by adding your first book."
              action={
                <Button size="sm" onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4" /> Add Book
                </Button>
              }
            />
          </Card>
        )}
      </FadeUp>

      {/* ---- Add Book Modal ------------------------------------------------ */}
      <Modal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          reset();
        }}
        title="Add Book"
      >
        <form
          onSubmit={handleSubmit((data) => createMutation.mutate(data))}
          className="space-y-4"
        >
          <Input
            id="book-title"
            label="Title"
            placeholder="e.g., Atomic Habits"
            {...register("title")}
            error={errors.title?.message}
          />
          <Input
            id="book-author"
            label="Author"
            placeholder="e.g., James Clear"
            {...register("author")}
            error={errors.author?.message}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="book-genre"
              label="Genre"
              placeholder="e.g., Self-help"
              {...register("genre")}
              error={errors.genre?.message}
            />
            <Input
              id="book-pages"
              label="Total Pages"
              type="number"
              placeholder="e.g., 320"
              {...register("pageCount", { valueAsNumber: true, setValueAs: (v: string) => v === "" ? undefined : parseInt(v, 10) })}
              error={errors.pageCount?.message}
            />
          </div>
          <Select
            id="book-status"
            label="Status"
            options={statusOptions}
            {...register("status")}
            error={errors.status?.message}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Add Book
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        title="Remove book?"
        description="This will permanently remove this book from your reading list. This action cannot be undone."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
