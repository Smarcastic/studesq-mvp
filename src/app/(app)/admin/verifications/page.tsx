"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { VerificationBadge } from "@/components/achievements/verification-badge";
import { categoryLabels } from "@/lib/validations/achievement";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import {
  ShieldCheck,
  ShieldAlert,
  Trophy,
  Building2,
  Calendar,
  User,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
} from "lucide-react";

interface PendingAchievement {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  date: string;
  issuingOrg?: string | null;
  verificationStatus: string;
  verificationLevel: number;
  proofDocumentUrl?: string | null;
  proofDocumentType: string;
  externalLink?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    school?: string | null;
    image?: string | null;
  };
  auditLogs: Array<{
    id: string;
    actionType: string;
    performedBy: string;
    notes?: string | null;
    createdAt: string;
  }>;
}

export default function AdminVerificationsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<PendingAchievement | null>(null);
  const [notes, setNotes] = useState("");
  const [approveLevel, setApproveLevel] = useState<2 | 3>(2);

  const { data: pending, isLoading } = useQuery({
    queryKey: ["admin-verifications"],
    queryFn: () => fetch("/api/achievements/verify").then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); }),
  });

  const actionMutation = useMutation({
    mutationFn: (params: { achievementId: string; action: "approve" | "reject"; notes?: string; level?: number }) =>
      fetch("/api/achievements/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }).then((r) => {
        if (!r.ok) throw new Error("Action failed");
        return r.json();
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      toast(vars.action === "approve" ? "Achievement verified" : "Achievement rejected");
      setSelected(null);
      setNotes("");
    },
    onError: () => toast("Action failed", "error"),
  });

  const handleApprove = () => {
    if (!selected) return;
    actionMutation.mutate({
      achievementId: selected.id,
      action: "approve",
      notes: notes || undefined,
      level: approveLevel,
    });
  };

  const handleReject = () => {
    if (!selected || !notes.trim()) {
      toast("Notes are required when rejecting", "warning");
      return;
    }
    actionMutation.mutate({
      achievementId: selected.id,
      action: "reject",
      notes,
    });
  };

  return (
    <div>
      <PageHeader
        title="Verification Queue"
        description="Review and verify student achievement submissions."
        action={
          <div className="flex items-center gap-2">
            <Badge variant="warning">
              {pending?.length ?? 0} Pending
            </Badge>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : pending?.length > 0 ? (
        <div className="space-y-4">
          {pending.map((a: PendingAchievement) => (
            <Card key={a.id} className="!p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-2.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 shrink-0">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{a.title}</h3>
                      <Badge variant="warning">{categoryLabels[a.category] || a.category}</Badge>
                      <VerificationBadge level={a.verificationLevel} status={a.verificationStatus} />
                    </div>
                    {a.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{a.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {a.user.name || a.user.email || "Unknown"}
                      </span>
                      {a.user.school && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {a.user.school}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDate(a.date)}
                      </span>
                      {a.issuingOrg && (
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3" /> {a.issuingOrg}
                        </span>
                      )}
                    </div>
                    {/* Proof indicators */}
                    <div className="flex items-center gap-3 mt-2">
                      {a.externalLink && (
                        <a
                          href={a.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> Proof Link
                        </a>
                      )}
                      {a.proofDocumentUrl && a.proofDocumentType === "PDF" && (
                        <a
                          href={a.proofDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <FileText className="h-3 w-3" /> View PDF
                        </a>
                      )}
                      {a.proofDocumentUrl && a.proofDocumentType === "IMAGE" && (
                        <a
                          href={a.proofDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline"
                        >
                          <ImageIcon className="h-3 w-3" /> View Image
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setSelected(a); setNotes(""); }}
                  >
                    Review
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ShieldCheck className="h-12 w-12" />}
          title="No pending verifications"
          description="All achievement submissions have been reviewed."
        />
      )}

      {/* Review Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Review Achievement"
        size="lg"
      >
        {selected && (
          <div className="space-y-5">
            {/* Achievement details */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{selected.title}</h4>
              {selected.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{selected.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Student</span>
                  <p className="font-medium">{selected.user.name || selected.user.email}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">School</span>
                  <p className="font-medium">{selected.user.school || "N/A"}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Category</span>
                  <p className="font-medium">{categoryLabels[selected.category] || selected.category}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Date</span>
                  <p className="font-medium">{formatDate(selected.date)}</p>
                </div>
                {selected.issuingOrg && (
                  <div>
                    <span className="text-gray-500 text-xs">Issuing Organization</span>
                    <p className="font-medium">{selected.issuingOrg}</p>
                  </div>
                )}
              </div>

              {/* Proof links */}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-dark-border">
                {selected.externalLink && (
                  <a
                    href={selected.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    <ExternalLink className="h-4 w-4" /> View Proof Link
                  </a>
                )}
                {selected.proofDocumentUrl && (
                  <a
                    href={selected.proofDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                  >
                    <FileText className="h-4 w-4" /> View Document
                  </a>
                )}
                {!selected.externalLink && !selected.proofDocumentUrl && (
                  <span className="text-sm text-gray-400">No proof documents attached</span>
                )}
              </div>
            </div>

            {/* Audit history */}
            {selected.auditLogs.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Audit Trail</h5>
                <div className="space-y-1.5">
                  {selected.auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium">{log.actionType}</span>
                      <span>—</span>
                      <span>{formatDate(log.createdAt)}</span>
                      {log.notes && <span className="text-gray-400">({log.notes})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verification level selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Verification Level (for approval)
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setApproveLevel(2)}
                  className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    approveLevel === 2
                      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                      : "border-gray-200 dark:border-dark-border hover:border-gray-300"
                  }`}
                >
                  <ShieldCheck className="h-5 w-5 mb-1 mx-auto" />
                  Level 2 — Verified
                </button>
                <button
                  onClick={() => setApproveLevel(3)}
                  className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    approveLevel === 3
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                      : "border-gray-200 dark:border-dark-border hover:border-gray-300"
                  }`}
                >
                  <Award className="h-5 w-5 mb-1 mx-auto" />
                  Level 3 — Institution
                </button>
              </div>
            </div>

            {/* Notes */}
            <Textarea
              id="notes"
              label="Verification Notes"
              placeholder="Add notes about your decision (required for rejection)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setSelected(null)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleReject}
                loading={actionMutation.isPending}
                className="!text-red-600 !border-red-300 hover:!bg-red-50 dark:hover:!bg-red-900/10"
              >
                <XCircle className="h-4 w-4" /> Reject
              </Button>
              <Button
                onClick={handleApprove}
                loading={actionMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4" /> Approve (Level {approveLevel})
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
