import { z } from "zod/v4";

export const noteSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().max(50000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export type NoteInput = z.infer<typeof noteSchema>;
