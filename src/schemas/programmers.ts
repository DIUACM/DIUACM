import { z } from "zod";

import { pageFields } from "../lib/pagination";

export const programmersListQuery = z.object({
  ...pageFields,
  // Searches name / username.
  q: z.string().trim().min(1).max(100).optional(),
});

export type ProgrammersListQuery = z.infer<typeof programmersListQuery>;
