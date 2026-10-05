"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { FadeUp, StaggerList, StaggerItem } from "@/components/ui/motion";
import {
  FileText,
  Upload,
  Trash2,
  Download,
  Search,
  FolderOpen,
  File,
  FileImage,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Document {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  category?: "transcript" | "certificate" | "essay" | "other";
  tags?: string[];
  folder?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

function getFileTypeIcon(fileName: string) {
  const ext = getFileExtension(fileName);
  if (ext === "pdf")
    return { icon: FileText, bg: "bg-red-50", color: "text-red-500" };
  if (["doc", "docx", "txt", "rtf"].includes(ext))
    return { icon: File, bg: "bg-blue-50", color: "text-blue-500" };
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext))
    return { icon: FileImage, bg: "bg-green-50", color: "text-green-500" };
  return { icon: File, bg: "bg-slate-50", color: "text-slate-500" };
}

function getCategoryBadgeVariant(category?: string) {
  switch (category) {
    case "transcript":
      return "primary" as const;
    case "certificate":
      return "success" as const;
    case "essay":
      return "info" as const;
    case "other":
    default:
      return "default" as const;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_TABS = [
  { id: "all", label: "All" },
  { id: "transcript", label: "Transcripts" },
  { id: "certificate", label: "Certificates" },
  { id: "essay", label: "Essays" },
  { id: "other", label: "Other" },
];

const CATEGORY_OPTIONS = [
  { value: "transcript", label: "Transcript" },
  { value: "certificate", label: "Certificate" },
  { value: "essay", label: "Essay" },
  { value: "other", label: "Other" },
];

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchDocuments(
  category: string,
  search: string
): Promise<Document[]> {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (search) params.set("search", search);
  const res = await fetch(`/api/documents?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load documents");
  return res.json();
}

async function createDocument(
  data: Omit<Document, "id" | "createdAt">
): Promise<Document> {
  const res = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create document");
  return res.json();
}

async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete document");
}

async function uploadFile(
  file: globalThis.File
): Promise<{ url: string; fileName: string; fileSize: number }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Failed to upload file");
  return res.json();
}

// ---------------------------------------------------------------------------
// Component: DocumentCard
// ---------------------------------------------------------------------------

function DocumentCard({
  doc,
  onDelete,
  isDeleting,
}: {
  doc: Document;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const { icon: Icon, bg, color } = getFileTypeIcon(doc.fileName);

  return (
    <Card className="bg-white border-slate-100 shadow-sm">
      <div className="flex items-start gap-4">
        <div
          className={`shrink-0 flex items-center justify-center w-11 h-11 rounded-xl ${bg}`}
        >
          <Icon className={`h-5 w-5 ${color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 truncate">
            {doc.title}
          </h3>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {doc.fileName}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {doc.category && (
              <Badge variant={getCategoryBadgeVariant(doc.category)}>
                {doc.category.charAt(0).toUpperCase() + doc.category.slice(1)}
              </Badge>
            )}
            <span className="text-xs text-slate-400">
              {formatFileSize(doc.fileSize)}
            </span>
            <span className="text-xs text-slate-400">
              {formatDate(doc.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <a
            href={doc.fileUrl}
            download={doc.fileName}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="icon" aria-label="Download">
              <Download className="h-4 w-4" />
            </Button>
          </a>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete"
            onClick={() => onDelete(doc.id)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component: UploadModal
// ---------------------------------------------------------------------------

function UploadModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("other");
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(
    null
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");

      // Step 1: upload file
      const { url, fileName, fileSize } = await uploadFile(selectedFile);

      // Step 2: create document record
      await createDocument({
        title: title || fileName,
        fileName,
        fileUrl: url,
        fileSize,
        fileType: getFileExtension(fileName),
        category: category as Document["category"],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast("Document uploaded successfully", "success");
      resetForm();
      onClose();
    },
    onError: (err: Error) => {
      toast(err.message || "Upload failed", "error");
    },
  });

  function resetForm() {
    setTitle("");
    setCategory("other");
    setSelectedFile(null);
    setIsDragOver(false);
  }

  function handleClose() {
    if (!uploadMutation.isPending) {
      resetForm();
      onClose();
    }
  }

  function handleFileSelect(file: globalThis.File | undefined) {
    if (!file) return;
    setSelectedFile(file);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [title]
  );

  return (
    <Modal open={open} onClose={handleClose} title="Upload Document" size="md">
      <div className="space-y-5">
        {/* Title */}
        <Input
          label="Title"
          id="doc-title"
          placeholder="Document title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Category */}
        <Select
          label="Category"
          id="doc-category"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        {/* File Drop Zone */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            File
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-colors ${
              isDragOver
                ? "border-cyan-400 bg-cyan-50/50"
                : selectedFile
                ? "border-slate-200 bg-slate-50"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />

            {selectedFile ? (
              <>
                <File className="h-8 w-8 text-cyan-500" />
                <p className="text-sm font-medium text-slate-700">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-400">
                  {formatFileSize(selectedFile.size)} &middot; Click or drop to
                  replace
                </p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">
                  Drag & drop a file here, or{" "}
                  <span className="font-medium text-cyan-600">browse</span>
                </p>
                <p className="text-xs text-slate-400">
                  PDF, DOC, images, and more
                </p>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploadMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => uploadMutation.mutate()}
            loading={uploadMutation.isPending}
            disabled={!selectedFile}
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Component: Loading Skeleton Grid
// ---------------------------------------------------------------------------

function DocumentSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="bg-white border-slate-100 shadow-sm">
          <div className="flex items-start gap-4">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function DocumentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch documents
  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents", activeCategory, search],
    queryFn: () => fetchDocuments(activeCategory, search),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onMutate: (id) => setDeletingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast("Document deleted", "success");
    },
    onError: (err: Error) => {
      toast(err.message || "Delete failed", "error");
    },
    onSettled: () => setDeletingId(null),
  });

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Documents"
        description="Store and organize your important documents."
        action={
          <Button variant="primary" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        }
      />

      <FadeUp>
        {/* Category Tabs */}
        <Tabs
          tabs={CATEGORY_TABS}
          activeTab={activeCategory}
          onChange={setActiveCategory}
          className="mb-6"
        />

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Document Grid */}
        {isLoading ? (
          <DocumentSkeletonGrid />
        ) : !documents || documents.length === 0 ? (
          <Card className="bg-white border-slate-100 shadow-sm">
            <EmptyState
              icon={<FolderOpen className="h-12 w-12" />}
              title="No documents yet"
              description="Upload your first document to get started. Transcripts, certificates, essays, and more."
              action={
                <Button variant="primary" onClick={() => setUploadOpen(true)}>
                  <Upload className="h-4 w-4" />
                  Upload Document
                </Button>
              }
            />
          </Card>
        ) : (
          <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <StaggerItem key={doc.id}>
                <DocumentCard
                  doc={doc}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  isDeleting={deletingId === doc.id}
                />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </FadeUp>

      {/* Upload Modal */}
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
