import { z } from "zod/v4";

export const achievementCategories = [
  "academic",
  "competition",
  "certificate",
  "extracurricular",
  "community_service",
  "sports",
  "creative",
  "leadership",
  "other",
] as const;

export const verificationStatuses = [
  "SELF_REPORTED",
  "DOCUMENT_UPLOADED",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
] as const;

export const proofDocumentTypes = [
  "NONE",
  "IMAGE",
  "PDF",
  "LINK",
] as const;

export const achievementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(achievementCategories),
  date: z.string().min(1, "Date is required"),
  issuingOrg: z.string().max(200).optional(),
  tags: z.array(z.string()).optional(),
  isHighlight: z.boolean().optional(),
  externalLink: z.string().url().optional().or(z.literal("")),
  proofDocumentUrl: z.string().optional().or(z.literal("")),
  proofDocumentType: z.enum(proofDocumentTypes).optional(),
  isPublic: z.boolean().optional(),
});

export type AchievementInput = z.infer<typeof achievementSchema>;

export const verificationActionSchema = z.object({
  achievementId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  notes: z.string().max(1000).optional(),
  level: z.number().min(2).max(3).optional(),
});

export type VerificationActionInput = z.infer<typeof verificationActionSchema>;

export const categoryLabels: Record<string, string> = {
  academic: "Academic",
  competition: "Competition",
  certificate: "Certificate",
  extracurricular: "Extracurricular",
  community_service: "Community Service",
  sports: "Sports",
  creative: "Creative",
  leadership: "Leadership",
  other: "Other",
};
