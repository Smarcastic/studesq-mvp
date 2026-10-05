import { z } from "zod/v4";

export const messageTypeSchema = z.enum([
  "text",
  "image",
  "poll",
  "quiz",
  "flashcard_share",
  "pomodoro_invite",
  "system",
]);

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(4000).optional(),
  type: messageTypeSchema.default("text"),
  metadata: z.string().optional(),
  replyToId: z.string().optional(),
});

export const createConversationSchema = z.object({
  type: z.enum(["dm", "group"]),
  memberIds: z.array(z.string()).min(1),
  name: z.string().min(1).max(100).optional(),
});
