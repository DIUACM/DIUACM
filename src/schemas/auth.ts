import { z } from "zod";

// Email is validated here but normalized (trim + lowercase) in the handlers,
// so the schemas stay free of transforms and convert cleanly via
// `z.toJSONSchema()` for the OpenAPI spec.

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  password: z.string().min(8).max(128),
  studentId: z.string().trim().min(1).max(20).optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores")
    .optional(),
  // `null` clears the student id; omitting the key leaves it unchanged.
  studentId: z.string().trim().min(1).max(20).nullable().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
