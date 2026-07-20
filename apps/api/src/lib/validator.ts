import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import { z, type ZodType } from "zod";

/**
 * Recursively trim every string in a JSON-ish value (plain objects and arrays
 * only — anything else passes through untouched).
 */
const deepTrim = (value: unknown): unknown => {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(deepTrim);
  if (
    value !== null &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, deepTrim(entry)]),
    );
  }
  return value;
};

/**
 * Wrapper around `zValidator` that turns validation failures into a consistent
 * `400 { error, issues[] }` response. Use on any route that takes input:
 *   route.post('/x', validate('json', schema), handler)
 *
 * String values in `json` and `query` targets are trimmed before validation,
 * so schemas see (and handlers store/compare) whitespace-free input by
 * default. This includes password fields: they are trimmed consistently on
 * both set and check, so the two sides always agree.
 */
export const validate = <T extends keyof ValidationTargets, S extends ZodType>(
  target: T,
  schema: S,
) => {
  const effective =
    target === "json" || target === "query"
      ? // The cast keeps `c.req.valid()` typed by the inner schema; preprocess
        // does not change the output type.
        (z.preprocess(deepTrim, schema) as unknown as S)
      : schema;
  return zValidator(target, effective, (result, c) => {
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
};
