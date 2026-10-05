import { z } from "zod/v4";

export const groupTypeSchema = z.enum(["school", "class", "study", "custom"]);

export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  description: z.string().max(500).optional(),
  type: groupTypeSchema.default("custom"),
  school: z.string().optional(),
  isPublic: z.boolean().default(false),
  maxMembers: z.number().int().min(2).max(500).default(100),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  maxMembers: z.number().int().min(2).max(500).optional(),
});

export const groupRoleSchema = z.enum(["member", "moderator", "admin"]);
