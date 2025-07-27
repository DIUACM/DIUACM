import { z } from "zod";
import { VisibilityStatus, EventType, ParticipationScope } from "@/db/schema";

// Schema for event form validation
export const eventFormSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must be less than 100 characters"),
    description: z.string().optional().nullable(),
    status: z.enum([VisibilityStatus.PUBLISHED, VisibilityStatus.DRAFT]),
    startingAt: z.coerce.date({
      message: "Starting time is required and must be a valid date",
    }),
    endingAt: z.coerce.date({
      message: "Ending time is required and must be a valid date",
    }),
    eventLink: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .nullable()
      .or(z.literal("")),
    eventPassword: z.string().optional().nullable().or(z.literal("")),
    openForAttendance: z.boolean(),
    strictAttendance: z.boolean(),
    type: z.enum([EventType.CONTEST, EventType.CLASS, EventType.OTHER]),
    participationScope: z.enum([
      ParticipationScope.OPEN_FOR_ALL,
      ParticipationScope.ONLY_GIRLS,
      ParticipationScope.JUNIOR_PROGRAMMERS,
      ParticipationScope.SELECTED_PERSONS,
    ]),
    ranklistId: z.number().optional().nullable(),
    ranklistWeight: z
      .number()
      .min(0.1, "Weight must be at least 0.1")
      .max(10, "Weight must be at most 10")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // Make sure endingAt is after startingAt
      return data.endingAt > data.startingAt;
    },
    {
      message: "End time must be after start time",
      path: ["endingAt"],
    }
  )
  .refine(
    (data) => {
      // If ranklist is selected, weight must be provided
      if (
        data.ranklistId &&
        (!data.ranklistWeight || data.ranklistWeight <= 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Weight is required when ranklist is selected",
      path: ["ranklistWeight"],
    }
  );

// Export type for the form values
export type EventFormValues = z.infer<typeof eventFormSchema>;
