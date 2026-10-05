/**
 * VerificationService — Achievement Trust Engine
 *
 * Core service for managing achievement verification,
 * trust score calculations, and audit trails.
 *
 * All verification-level changes are server-only.
 * No client-side mutation of verification state.
 */

import { prisma } from "@/lib/prisma";

// ============================================================
// Types
// ============================================================

export type VerificationStatus =
  | "SELF_REPORTED"
  | "DOCUMENT_UPLOADED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED";

export type ProofDocumentType = "NONE" | "IMAGE" | "PDF" | "LINK";

export type AuditActionType =
  | "CREATED"
  | "UPDATED"
  | "DOCUMENT_UPLOADED"
  | "SUBMITTED_FOR_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "VISIBILITY_CHANGED"
  | "DELETED";

export interface VerificationBadge {
  level: number;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

// ============================================================
// Constants
// ============================================================

/** Trust score points per verification level */
const TRUST_POINTS: Record<number, number> = {
  0: 1,  // Self Reported
  1: 5,  // Document Uploaded
  2: 15, // Verified by Institution
  3: 30, // Externally Confirmed
};

/** Badge visual config per verification level */
export const VERIFICATION_BADGES: Record<number, VerificationBadge> = {
  0: {
    level: 0,
    label: "Self Reported",
    color: "text-gray-500",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    borderColor: "border-gray-200 dark:border-gray-700",
    description: "This achievement was self-reported by the student.",
  },
  1: {
    level: 1,
    label: "Document Uploaded",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    description: "Supporting documentation has been uploaded for this achievement.",
  },
  2: {
    level: 2,
    label: "Verified",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    description: "This achievement has been verified by an administrator.",
  },
  3: {
    level: 3,
    label: "Institution Confirmed",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    description: "This achievement has been confirmed by the issuing institution.",
  },
};

/** Status display config */
export const STATUS_CONFIG: Record<VerificationStatus, { label: string; color: string }> = {
  SELF_REPORTED: { label: "Self Reported", color: "text-gray-500" },
  DOCUMENT_UPLOADED: { label: "Document Uploaded", color: "text-blue-500" },
  UNDER_REVIEW: { label: "Under Review", color: "text-yellow-500" },
  VERIFIED: { label: "Verified", color: "text-emerald-500" },
  REJECTED: { label: "Rejected", color: "text-red-500" },
};

// ============================================================
// Trust Score Calculation
// ============================================================

/**
 * Calculate trust score impact for a given verification level.
 */
export function getTrustImpact(level: number): number {
  return TRUST_POINTS[level] ?? TRUST_POINTS[0];
}

/**
 * Recalculate a user's total trust score from all their achievements.
 * Called after any verification level change or achievement deletion.
 */
export async function recalculateTrustScore(userId: string): Promise<{ trustScore: number; verifiedCount: number }> {
  const achievements = await prisma.achievement.findMany({
    where: {
      userId,
      verificationStatus: { not: "REJECTED" },
    },
    select: {
      verificationLevel: true,
      verificationStatus: true,
    },
  });

  let trustScore = 0;
  let verifiedCount = 0;

  for (const a of achievements) {
    trustScore += getTrustImpact(a.verificationLevel);
    if (a.verificationStatus === "VERIFIED" || a.verificationLevel >= 2) {
      verifiedCount++;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      trustScore,
      verifiedAchievementsCount: verifiedCount,
    },
  });

  return { trustScore, verifiedCount };
}

// ============================================================
// Audit Logging
// ============================================================

/**
 * Create an audit log entry for an achievement action.
 */
export async function createAuditLog(params: {
  achievementId: string;
  actionType: AuditActionType;
  performedBy: string;
  notes?: string;
}) {
  return prisma.achievementAuditLog.create({
    data: {
      achievementId: params.achievementId,
      actionType: params.actionType,
      performedBy: params.performedBy,
      notes: params.notes ?? null,
    },
  });
}

// ============================================================
// Verification Operations (Server-only)
// ============================================================

/**
 * Upload proof document for an achievement.
 * Moves status to DOCUMENT_UPLOADED and level to 1.
 */
export async function uploadProofDocument(params: {
  achievementId: string;
  userId: string;
  proofDocumentUrl: string;
  proofDocumentType: ProofDocumentType;
}) {
  const achievement = await prisma.achievement.findFirst({
    where: { id: params.achievementId, userId: params.userId },
  });

  if (!achievement) throw new Error("Achievement not found");

  const updated = await prisma.achievement.update({
    where: { id: params.achievementId },
    data: {
      proofDocumentUrl: params.proofDocumentUrl,
      proofDocumentType: params.proofDocumentType,
      verificationStatus: "DOCUMENT_UPLOADED",
      verificationLevel: Math.max(achievement.verificationLevel, 1),
      trustScoreImpact: getTrustImpact(Math.max(achievement.verificationLevel, 1)),
    },
  });

  await createAuditLog({
    achievementId: params.achievementId,
    actionType: "DOCUMENT_UPLOADED",
    performedBy: params.userId,
    notes: `Document type: ${params.proofDocumentType}`,
  });

  await recalculateTrustScore(params.userId);

  return updated;
}

/**
 * Submit an achievement for admin review.
 * Requires document to be uploaded first.
 */
export async function requestVerification(params: {
  achievementId: string;
  userId: string;
}) {
  const achievement = await prisma.achievement.findFirst({
    where: { id: params.achievementId, userId: params.userId },
  });

  if (!achievement) throw new Error("Achievement not found");
  if (achievement.verificationLevel < 1) {
    throw new Error("Must upload proof document before requesting verification");
  }

  const updated = await prisma.achievement.update({
    where: { id: params.achievementId },
    data: {
      verificationStatus: "UNDER_REVIEW",
    },
  });

  await createAuditLog({
    achievementId: params.achievementId,
    actionType: "SUBMITTED_FOR_REVIEW",
    performedBy: params.userId,
  });

  return updated;
}

/**
 * Approve an achievement verification (admin action).
 * Sets level to 2 (Verified), status to VERIFIED.
 */
export async function approveVerification(params: {
  achievementId: string;
  adminUserId: string;
  notes?: string;
  level?: number; // override level (2 or 3)
}) {
  const level = params.level ?? 2;
  if (level < 2 || level > 3) throw new Error("Invalid verification level for approval");

  const achievement = await prisma.achievement.findUnique({
    where: { id: params.achievementId },
  });

  if (!achievement) throw new Error("Achievement not found");

  const updated = await prisma.achievement.update({
    where: { id: params.achievementId },
    data: {
      verificationStatus: "VERIFIED",
      verificationLevel: level,
      trustScoreImpact: getTrustImpact(level),
      verifiedByUserId: params.adminUserId,
      verifiedAt: new Date(),
      verificationNotes: params.notes ?? null,
    },
  });

  await createAuditLog({
    achievementId: params.achievementId,
    actionType: "VERIFIED",
    performedBy: params.adminUserId,
    notes: params.notes ?? `Approved at level ${level}`,
  });

  await recalculateTrustScore(achievement.userId);

  return updated;
}

/**
 * Reject an achievement verification (admin action).
 */
export async function rejectVerification(params: {
  achievementId: string;
  adminUserId: string;
  notes: string;
}) {
  const achievement = await prisma.achievement.findUnique({
    where: { id: params.achievementId },
  });

  if (!achievement) throw new Error("Achievement not found");

  const updated = await prisma.achievement.update({
    where: { id: params.achievementId },
    data: {
      verificationStatus: "REJECTED",
      verificationLevel: 0,
      trustScoreImpact: 0,
      verifiedByUserId: params.adminUserId,
      verifiedAt: new Date(),
      verificationNotes: params.notes,
    },
  });

  await createAuditLog({
    achievementId: params.achievementId,
    actionType: "REJECTED",
    performedBy: params.adminUserId,
    notes: params.notes,
  });

  await recalculateTrustScore(achievement.userId);

  return updated;
}

/**
 * Toggle achievement public visibility.
 */
export async function setAchievementVisibility(params: {
  achievementId: string;
  userId: string;
  isPublic: boolean;
}) {
  const achievement = await prisma.achievement.findFirst({
    where: { id: params.achievementId, userId: params.userId },
  });

  if (!achievement) throw new Error("Achievement not found");

  const updated = await prisma.achievement.update({
    where: { id: params.achievementId },
    data: { isPublic: params.isPublic },
  });

  await createAuditLog({
    achievementId: params.achievementId,
    actionType: "VISIBILITY_CHANGED",
    performedBy: params.userId,
    notes: params.isPublic ? "Set to public" : "Set to private",
  });

  return updated;
}

/**
 * Get all achievements pending review (admin).
 */
export async function getPendingVerifications() {
  return prisma.achievement.findMany({
    where: { verificationStatus: "UNDER_REVIEW" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          school: true,
          image: true,
        },
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { updatedAt: "asc" }, // oldest first
  });
}

/**
 * Get verification badge info for a given level.
 */
export function getVerificationBadge(level: number): VerificationBadge {
  return VERIFICATION_BADGES[level] ?? VERIFICATION_BADGES[0];
}

/**
 * Get trust score tier based on score value.
 */
export function getTrustTier(score: number): {
  label: string;
  color: string;
  level: string;
} {
  if (score >= 200) return { label: "Diamond", color: "text-cyan-500", level: "diamond" };
  if (score >= 100) return { label: "Gold", color: "text-amber-500", level: "gold" };
  if (score >= 50) return { label: "Silver", color: "text-gray-400", level: "silver" };
  if (score >= 10) return { label: "Bronze", color: "text-orange-600", level: "bronze" };
  return { label: "Starter", color: "text-gray-500", level: "starter" };
}

// ============================================================
// File Validation
// ============================================================

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_PDF_TYPES = ["application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateProofFile(file: { type: string; size: number }): {
  valid: boolean;
  error?: string;
  documentType: ProofDocumentType;
} {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size exceeds 10MB limit", documentType: "NONE" };
  }

  if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: true, documentType: "IMAGE" };
  }

  if (ALLOWED_PDF_TYPES.includes(file.type)) {
    return { valid: true, documentType: "PDF" };
  }

  return {
    valid: false,
    error: "Only JPEG, PNG, WebP images and PDF files are accepted",
    documentType: "NONE",
  };
}

export function validateProofLink(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
