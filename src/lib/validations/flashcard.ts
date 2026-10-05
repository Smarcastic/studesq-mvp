import { z } from "zod/v4";

export const deckSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  subject: z.string().max(100).optional(),
  color: z.string().max(20).optional(),
});

export type DeckInput = z.infer<typeof deckSchema>;

export const cardSchema = z.object({
  front: z.string().min(1, "Front side is required").max(2000),
  back: z.string().min(1, "Back side is required").max(2000),
  hints: z.string().max(500).optional(),
});

export type CardInput = z.infer<typeof cardSchema>;

export const reviewSchema = z.object({
  difficulty: z.enum(["hard", "good", "easy"]),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export const deckColors = [
  { value: "teal", label: "Teal", class: "bg-teal-500" },
  { value: "indigo", label: "Indigo", class: "bg-indigo-500" },
  { value: "rose", label: "Rose", class: "bg-rose-500" },
  { value: "amber", label: "Amber", class: "bg-amber-500" },
  { value: "emerald", label: "Emerald", class: "bg-emerald-500" },
  { value: "violet", label: "Violet", class: "bg-violet-500" },
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
];
