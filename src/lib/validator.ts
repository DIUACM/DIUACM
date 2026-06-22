import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";

/**
 * Wrapper around `zValidator` that turns validation failures into a consistent
 * `400 { error, issues[] }` response. Use on any route that takes input:
 *   route.post('/x', validate('json', schema), handler)
 */
export const validate = <T extends keyof ValidationTargets, S extends ZodType>(
  target: T,
  schema: S,
) =>
  zValidator(target, schema, (result, c) => {
    if (result.success) return;
    const issues = result.error.issues.map((issue) => {
      const field = issue.path.length ? issue.path.join(".") : "(root)";
      const message =
        issue.code === "invalid_type" &&
        (issue as { received?: unknown }).received === "undefined"
          ? "Required"
          : issue.message;
      return { field, message };
    });
    return c.json({ error: "Validation failed", issues }, 400);
  });
