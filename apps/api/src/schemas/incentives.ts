import { z } from "zod";

import { pageFields } from "../lib/pagination";

// One course claimed on an application, with the teacher who runs it. Every
// field is required — a half-filled course is of no use to whoever processes
// the application.
export const incentiveCourseSchema = z.object({
  courseName: z.string().trim().min(1).max(150),
  courseCode: z.string().trim().min(1).max(30),
  teacherName: z.string().trim().min(1).max(100),
  teacherInitial: z.string().trim().min(1).max(20),
  section: z.string().trim().min(1).max(20),
  teacherEmail: z.email().max(150),
  teacherPhone: z.string().trim().min(1).max(30),
});

// The applicant's email is not accepted from the client — it is copied from the
// signed-in account, matching the read-only email field on the form.
export const incentiveApplicationSubmitSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  // Free text rather than the account's `studentId`: an applicant may not have
  // set one on their profile, and the form asks for it directly.
  studentId: z.string().trim().min(1).max(30),
  batch: z.string().trim().min(1).max(50),
  currentSemester: z.string().trim().min(1).max(50),
  phoneNumber: z.string().trim().min(1).max(30),
  // The cap is a sanity bound, not a policy: nobody takes 20 courses at once.
  courses: z.array(incentiveCourseSchema).min(1).max(20),
});

export const adminIncentiveApplicationsListQuery = z.object({
  ...pageFields,
  // Searches full name / student id / email / phone number / batch.
  q: z.string().trim().min(1).max(100).optional(),
  batch: z.string().trim().min(1).max(50).optional(),
  semester: z.string().trim().min(1).max(50).optional(),
});

export type IncentiveCourseInput = z.infer<typeof incentiveCourseSchema>;
export type IncentiveApplicationSubmitInput = z.infer<
  typeof incentiveApplicationSubmitSchema
>;
