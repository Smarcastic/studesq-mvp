import { z } from "zod/v4";

export const goalSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(["academic", "extracurricular", "personal"]).optional(),
  targetDate: z.string().optional(),
  progress: z.number().min(0).max(100).optional().default(0),
  status: z.enum(["active", "completed", "archived"]).optional().default("active"),
  milestones: z.array(z.object({
    title: z.string().min(1).max(200),
    completed: z.boolean().optional().default(false),
  })).max(20).optional(),
});

export type GoalInput = z.input<typeof goalSchema>;

export const goalCategoryLabels: Record<string, string> = {
  academic: "Academic",
  extracurricular: "Extracurricular",
  personal: "Personal",
};

export const goalCategoryColors: Record<string, "primary" | "secondary" | "warning"> = {
  academic: "primary",
  extracurricular: "secondary",
  personal: "warning",
};
