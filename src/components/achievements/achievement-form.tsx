"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { achievementSchema, achievementCategories, categoryLabels, type AchievementInput } from "@/lib/validations/achievement";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  X,
  AlertTriangle,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Shield,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Loader2,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";

interface AchievementFormProps {
  defaultValues?: Partial<AchievementInput>;
  onSubmit: (data: AchievementInput) => void;
  onCancel: () => void;
  saving?: boolean;
}

const ACCEPTED_FILE_TYPES = ".pdf,.png,.jpg,.jpeg,.webp";
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export function AchievementForm({ defaultValues, onSubmit, onCancel, saving }: AchievementFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AchievementInput>({
    resolver: zodResolver(achievementSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "academic",
      date: new Date().toISOString().split("T")[0],
      issuingOrg: "",
      tags: [],
      isHighlight: false,
      externalLink: "",
      proofDocumentUrl: "",
      proofDocumentType: "NONE",
      isPublic: true,
      ...defaultValues,
    },
  });

  const tags = watch("tags") || [];
  const isHighlight = watch("isHighlight");
  const isPublic = watch("isPublic");
  const externalLink = watch("externalLink");
  const proofDocumentUrl = watch("proofDocumentUrl");
  const proofDocumentType = watch("proofDocumentType");
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(
    defaultValues?.proofDocumentUrl ? "Previously uploaded" : null
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setValue("tags", [...tags, trimmed]);
      setTagInput("");
    }
  };

  const categoryOptions = achievementCategories.map((c) => ({
    value: c,
    label: categoryLabels[c] || c,
  }));

  // ====== FILE UPLOAD LOGIC ======

  const uploadFile = useCallback(async (file: File) => {
    // Client-side validation
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only PDF, PNG, JPEG, and WebP files are accepted.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }

      const { url } = await res.json();

      // Determine type
      const docType = file.type === "application/pdf" ? "PDF" : "IMAGE";

      setValue("proofDocumentUrl", url);
      setValue("proofDocumentType", docType);
      setUploadedFileName(file.name);
      setUploadError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  }, [setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeUpload = () => {
    setValue("proofDocumentUrl", "");
    setValue("proofDocumentType", "NONE");
    setUploadedFileName(null);
    setUploadError(null);
  };

  // Determine if any proof is provided (link or document)
  const hasProof = !!(externalLink || proofDocumentUrl);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        id="title"
        label="Title"
        placeholder="e.g., First Place in Science Fair"
        {...register("title")}
        error={errors.title?.message}
      />

      <Textarea
        id="description"
        label="Description"
        placeholder="Describe what you achieved..."
        {...register("description")}
        error={errors.description?.message}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          id="category"
          label="Category"
          options={categoryOptions}
          {...register("category")}
          error={errors.category?.message}
        />
        <Input
          id="date"
          label="Date"
          type="date"
          {...register("date")}
          error={errors.date?.message}
        />
      </div>

      <Input
        id="issuingOrg"
        label="Issuing Organization"
        placeholder="e.g., National Science Foundation"
        {...register("issuingOrg")}
      />

      {/* ====== VERIFICATION SECTION ====== */}
      <div className="border-t border-gray-200 dark:border-dark-border pt-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-primary-500" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Verification</h4>
        </div>

        {/* External proof link */}
        <div className="space-y-1.5 mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Proof Link
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("externalLink")}
              placeholder="https://example.com/certificate or competition results page"
              className="flex h-10 w-full rounded-lg border-2 bg-white dark:bg-dark-surface pl-10 pr-3 py-2 text-sm border-gray-300 dark:border-dark-border placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          {errors.externalLink?.message && (
            <p className="text-xs text-red-500">{errors.externalLink.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Link to a certificate page, competition results, or other verifiable proof.
          </p>
        </div>

        {/* ====== FILE UPLOAD ZONE ====== */}
        <div className="space-y-1.5 mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload Certificate / Proof Document
          </label>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileChange}
            className="hidden"
          />

          {proofDocumentUrl && uploadedFileName ? (
            /* ===== Uploaded file preview ===== */
            <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-800/30 shrink-0">
                {proofDocumentType === "PDF" ? (
                  <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 truncate">
                  {uploadedFileName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    Uploaded successfully
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={removeUpload}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove file"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* ===== Drop zone ===== */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                uploading
                  ? "border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-surface/50 cursor-wait"
                  : isDragging
                  ? "border-primary-400 bg-primary-50/50 dark:bg-primary-900/10 scale-[1.01]"
                  : "border-gray-300 dark:border-dark-border hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-dark-surface/50"
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
                  <p className="text-sm text-gray-500">Uploading...</p>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-full bg-gray-100 dark:bg-dark-border/50">
                    <Upload className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span className="text-primary-500">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF, PNG, JPEG, or WebP up to {MAX_FILE_SIZE_MB}MB
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Upload error */}
          {uploadError && (
            <div className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {uploadError}
            </div>
          )}
        </div>

        {/* Visibility toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isPublic ? (
              <Eye className="h-4 w-4 text-gray-500" />
            ) : (
              <EyeOff className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isPublic ? "Visible on public profile" : "Hidden from public profile"}
            </span>
          </div>
          <Toggle
            checked={isPublic ?? true}
            onChange={(val) => setValue("isPublic", val)}
          />
        </div>

        {/* Trust warning — only show when no proof at all */}
        {!hasProof && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Unverified achievements reduce profile trust weight. Add a proof link or upload supporting documentation to increase credibility.
            </p>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              {tag}
              <button type="button" onClick={() => setValue("tags", tags.filter((t) => t !== tag))} className="hover:text-primary-900 dark:hover:text-primary-100">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder="Type and press Enter..."
          className="flex h-10 w-full rounded-lg border-2 bg-white dark:bg-dark-surface px-3 py-2 text-sm border-gray-300 dark:border-dark-border placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      <div className="flex items-center gap-3">
        <Toggle checked={isHighlight || false} onChange={(val) => setValue("isHighlight", val)} />
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Highlight Achievement</label>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving} disabled={uploading}>
          {defaultValues?.title ? "Save Changes" : "Add Achievement"}
        </Button>
      </div>
    </form>
  );
}
