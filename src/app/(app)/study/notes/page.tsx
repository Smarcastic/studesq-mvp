"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs } from "@/components/ui/tabs";
import { parseJsonArray, formatRelativeTime } from "@/lib/utils";
import { Plus, Search, FileText, Pin, Trash2, Archive, ArchiveRestore, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

interface NoteData {
  id: string;
  title: string;
  content?: string;
  tags?: string;
  isPinned: boolean;
  isArchived: boolean;
  updatedAt: string;
  createdAt: string;
}

export default function NotesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState("active");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data: notes, isLoading } = useQuery<NoteData[]>({
    queryKey: ["notes", search, viewMode, selectedTag],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (viewMode === "archived") params.set("archived", "true");
      if (selectedTag) params.set("tag", selectedTag);
      return fetch(`/api/notes?${params}`).then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); });
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Note" }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create");
        return r.json();
      }),
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      router.push(`/study/notes/${note.id}`);
    },
    onError: () => toast("Failed to create note", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/notes/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast("Note deleted");
    },
    onError: () => toast("Failed to delete note", "error"),
  });

  const togglePinMutation = useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
      fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !isPinned }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update");
        return r.json();
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast(variables.isArchived ? "Note archived" : "Note restored");
    },
    onError: () => toast("Failed to archive note", "error"),
  });

  // Collect all unique tags across notes for tag cloud
  const allTags = useMemo(() => {
    if (!notes) return [];
    const tagSet = new Set<string>();
    for (const note of notes) {
      for (const tag of parseJsonArray(note.tags)) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [notes]);

  const getPreview = (content?: string) => {
    if (!content) return "Empty note";
    // Strip HTML/markdown for preview
    const text = content.replace(/<[^>]*>/g, "").replace(/[#*_~`]/g, "");
    return text.length > 120 ? text.slice(0, 120) + "..." : text;
  };

  return (
    <div>
      <PageHeader
        title="Notes"
        description="Organize and manage your study notes."
        action={
          <Button size="sm" onClick={() => createMutation.mutate()} loading={createMutation.isPending}>
            <Plus className="h-4 w-4" /> New Note
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: "active", label: "Active" },
          { id: "archived", label: "Archived" },
        ]}
        activeTab={viewMode}
        onChange={(id) => { setViewMode(id); setSelectedTag(null); }}
        className="mb-4"
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes..."
          className="flex h-10 w-full rounded-lg border-2 bg-white dark:bg-dark-surface pl-10 pr-3 py-2 text-sm border-gray-300 dark:border-dark-border placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      {/* Tag filter cloud */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-gray-400 mr-1">Tags:</span>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                selectedTag === tag
                  ? "bg-primary-500 text-white"
                  : "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 hover:bg-primary-200"
              }`}
            >
              {tag}
            </button>
          ))}
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : notes && notes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => {
            const tags = parseJsonArray(note.tags);
            return (
              <Card key={note.id} hover className="relative group">
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {viewMode === "active" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePinMutation.mutate({ id: note.id, isPinned: note.isPinned }); }}
                      className={`p-1 rounded-lg transition-colors ${note.isPinned ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"}`}
                      title={note.isPinned ? "Unpin" : "Pin"}
                    >
                      <Pin className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); archiveMutation.mutate({ id: note.id, isArchived: viewMode !== "archived" }); }}
                    className="p-1 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
                    title={viewMode === "archived" ? "Restore" : "Archive"}
                  >
                    {viewMode === "archived" ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(note.id); }}
                    className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    title="Delete permanently"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <Link href={`/study/notes/${note.id}`} className="block">
                  <div className="flex items-start gap-2 mb-2">
                    {note.isPinned && <Pin className="h-3.5 w-3.5 text-amber-500 mt-1 shrink-0" />}
                    <h3 className="font-semibold truncate">{note.title}</h3>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-3">
                    {getPreview(note.content)}
                  </p>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="default">{tag}</Badge>
                      ))}
                      {tags.length > 3 && (
                        <Badge variant="default">+{tags.length - 3}</Badge>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-gray-400">{formatRelativeTime(note.updatedAt)}</p>
                </Link>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="No notes yet"
          description="Create your first note to start organizing your thoughts."
          action={
            <Button size="sm" onClick={() => createMutation.mutate()} loading={createMutation.isPending}>
              <Plus className="h-4 w-4" /> New Note
            </Button>
          }
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        title="Delete note?"
        description="This will permanently remove this note. This action cannot be undone."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
