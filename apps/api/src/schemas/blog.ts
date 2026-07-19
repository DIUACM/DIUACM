import { z } from "zod";

import { pageFields } from "../lib/pagination";

export const blogListQuery = z.object({
  ...pageFields,
  // Searches title / content.
  q: z.string().trim().min(1).max(100).optional(),
});
