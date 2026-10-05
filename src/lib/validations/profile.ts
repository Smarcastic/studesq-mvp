import { z } from "zod/v4";

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  bio: z.string().max(500).optional(),
  school: z.string().max(200).optional(),
  grade: z.string().max(50).optional(),
  graduationYear: z.number().int().min(2020).max(2040).optional().nullable(),
  location: z.string().max(200).optional(),
  interests: z.array(z.string()).optional(),
  careerAspirations: z.string().max(500).optional(),
  languages: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  academicGoals: z.string().max(1000).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
