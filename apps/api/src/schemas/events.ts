import { z } from "zod";

import { pageFields } from "../lib/pagination";

export const EVENT_TYPES = ["contest", "class", "other"] as const;
export const EVENT_SCOPES = [
  "open_for_all",
  "only_girls",
  "junior_programmers",
  "selected_persons",
] as const;

export const eventsListQuery = z.object({
  ...pageFields,
  type: z.enum(EVENT_TYPES).optional(),
  scope: z.enum(EVENT_SCOPES).optional(),
  // Searches title / description / event link.
  q: z.string().trim().min(1).max(100).optional(),
});

export const attendanceGiveSchema = z.object({
  password: z.string().min(1).max(200),
});

export type EventsListQuery = z.infer<typeof eventsListQuery>;
export type AttendanceGiveInput = z.infer<typeof attendanceGiveSchema>;
