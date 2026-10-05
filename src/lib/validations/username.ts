import { z } from "zod/v4";

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Only letters, numbers, and underscores allowed"
  )
  .regex(/^(?!.*__).+$/, "No consecutive underscores")
  .transform((v) => v.toLowerCase());
