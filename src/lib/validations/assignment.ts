import { z } from "zod/v4";

export const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  subject: z.string().max(100).optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional().default("medium"),
  status: z.enum(["todo", "in_progress", "done"]).optional().default("todo"),
});

export type AssignmentInput = z.input<typeof assignmentSchema>;

export const priorityColors: Record<string, string> = {
  low: "default",
  medium: "info",
  high: "warning",
  urgent: "error",
};

export const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};
