"use server";

import { db } from "@/db/drizzle";
import {
  rankLists,
  trackers,
  eventRankList,
  rankListUser,
  events,
  users,
  eventUserAttendance,
} from "@/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  eq,
  or,
  ilike,
  count,
  desc,
  and,
  asc,
  sql,
  notInArray,
} from "drizzle-orm";
import {
  ranklistFormSchema,
  type RanklistFormValues,
} from "./schemas/ranklist";
import { hasPermission } from "@/lib/authorization";

// Enhanced error handling type
type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Utility function to handle database errors
function handleDbError(error: unknown): ActionResult {
  console.error("Database error:", error);

  if (error instanceof Error) {
    if (error.message.includes("Duplicate entry")) {
      return {
        success: false,
        error: "A ranklist with this keyword already exists in this tracker",
      };
    }
    if (error.message.includes("foreign key constraint")) {
      return { success: false, error: "Invalid tracker reference" };
    }
  }

  return { success: false, error: "Something went wrong. Please try again." };
}

// Utility function to validate permissions
async function validatePermission(): Promise<ActionResult | null> {
  if (!(await hasPermission("TRACKERS:MANAGE"))) {
    return {
      success: false,
      error: "You don't have permission to manage trackers",
    };
  }
  return null;
}

export async function createRanklist(
  trackerId: number,
  values: RanklistFormValues
): Promise<ActionResult> {
  try {
    const permissionError = await validatePermission();
    if (permissionError) return permissionError;

    const validatedFields = ranklistFormSchema.parse(values);

    // Check if tracker exists
    const tracker = await db
      .select({ id: trackers.id, title: trackers.title })
      .from(trackers)
      .where(eq(trackers.id, trackerId))
      .limit(1);

    if (tracker.length === 0) {
      return { success: false, error: "Tracker not found" };
    }

    // Check if ranklist keyword already exists in this tracker
    const existingRanklist = await db
      .select({ id: rankLists.id })
      .from(rankLists)
      .where(
        and(
          eq(rankLists.trackerId, trackerId),
          eq(rankLists.keyword, validatedFields.keyword)
        )
      )
      .limit(1);

    if (existingRanklist.length > 0) {
      return {
        success: false,
        error: "A ranklist with this keyword already exists in this tracker",
      };
    }

    const result = await db
      .insert(rankLists)
      .values({
        trackerId,
        keyword: validatedFields.keyword,
        description: validatedFields.description || null,
        weightOfUpsolve: validatedFields.weightOfUpsolve,
        order: validatedFields.order,
        isActive: validatedFields.isActive,
        considerStrictAttendance: validatedFields.considerStrictAttendance,
      })
      .returning({ id: rankLists.id });

    revalidatePath(`/admin/trackers/${trackerId}/ranklists`);

    return {
      success: true,
      data: { ...validatedFields, id: result[0].id, trackerId },
      message: "Ranklist created successfully",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Please check the form for errors.",
      };
    }

    return handleDbError(error);
  }
}

export async function updateRanklist(
  id: number,
  trackerId: number,
  values: RanklistFormValues
): Promise<ActionResult> {
  try {
    const permissionError = await validatePermission();
    if (permissionError) return permissionError;

    const validatedFields = ranklistFormSchema.parse(values);

    // Check if ranklist exists
    const existingRanklist = await db
      .select({ id: rankLists.id, trackerId: rankLists.trackerId })
      .from(rankLists)
      .where(eq(rankLists.id, id))
      .limit(1);

    if (existingRanklist.length === 0) {
      return { success: false, error: "Ranklist not found" };
    }

    if (existingRanklist[0].trackerId !== trackerId) {
      return {
        success: false,
        error: "Ranklist does not belong to this tracker",
      };
    }

    // Check if another ranklist with same keyword exists in this tracker (excluding current ranklist)
    const duplicateRanklist = await db
      .select({ id: rankLists.id })
      .from(rankLists)
      .where(
        and(
          eq(rankLists.trackerId, trackerId),
          eq(rankLists.keyword, validatedFields.keyword),
          sql`${rankLists.id} != ${id}`
        )
      )
      .limit(1);

    if (duplicateRanklist.length > 0) {
      return {
        success: false,
        error: "A ranklist with this keyword already exists in this tracker",
      };
    }

    await db
      .update(rankLists)
      .set({
        keyword: validatedFields.keyword,
        description: validatedFields.description || null,
        weightOfUpsolve: validatedFields.weightOfUpsolve,
        order: validatedFields.order,
        isActive: validatedFields.isActive,
        considerStrictAttendance: validatedFields.considerStrictAttendance,
      })
      .where(eq(rankLists.id, id));

    revalidatePath(`/admin/trackers/${trackerId}/ranklists`);
    revalidatePath(`/admin/trackers/${trackerId}/ranklists/${id}/edit`);

    return {
      success: true,
      data: { ...validatedFields, id, trackerId },
      message: "Ranklist updated successfully",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Please check the form for errors.",
      };
    }

    return handleDbError(error);
  }
}

export async function deleteRanklist(id: number): Promise<ActionResult> {
  try {
    const permissionError = await validatePermission();
    if (permissionError) return permissionError;

    // Check if ranklist exists
    const ranklistData = await db
      .select({
        id: rankLists.id,
        keyword: rankLists.keyword,
        trackerId: rankLists.trackerId,
      })
      .from(rankLists)
      .where(eq(rankLists.id, id))
      .limit(1);

    if (ranklistData.length === 0) {
      return { success: false, error: "Ranklist not found" };
    }

    const ranklist = ranklistData[0];

    // Get event and user counts separately
    const [eventCountResult, userCountResult] = await Promise.all([
      db
        .select({ count: count() })
        .from(eventRankList)
        .where(eq(eventRankList.rankListId, ranklist.id)),
      db
        .select({ count: count() })
        .from(rankListUser)
        .where(eq(rankListUser.rankListId, ranklist.id)),
    ]);

    const eventCount = eventCountResult[0]?.count || 0;
    const userCount = userCountResult[0]?.count || 0;

    const totalAttachments = eventCount + userCount;
    if (totalAttachments > 0) {
      return {
        success: false,
        error: `Cannot delete ranklist "${ranklist.keyword}" because it has ${eventCount} event(s) and ${userCount} user(s) attached. Please remove all attachments first.`,
      };
    }

    await db.delete(rankLists).where(eq(rankLists.id, id));

    revalidatePath(`/admin/trackers/${ranklist.trackerId}/ranklists`);

    return {
      success: true,
      message: `Ranklist "${ranklist.keyword}" deleted successfully`,
    };
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getRanklist(
  id: number,
  trackerId: number
): Promise<ActionResult> {
  try {
    const permissionError = await validatePermission();
    if (permissionError) return permissionError;

    const [ranklist] = await db
      .select()
      .from(rankLists)
      .where(and(eq(rankLists.id, id), eq(rankLists.trackerId, trackerId)))
      .limit(1);

    if (!ranklist) {
      return { success: false, error: "Ranklist not found" };
    }

    return { success: true, data: ranklist };
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getPaginatedRanklists(
  trackerId: number,
  page: number = 1,
  pageSize: number = 10,
  search?: string
): Promise<ActionResult> {
  try {
    const permissionError = await validatePermission();
    if (permissionError) return permissionError;

    const offset = (page - 1) * pageSize;

    // Build search condition
    const searchCondition = search
      ? or(
          ilike(rankLists.keyword, `%${search}%`),
          ilike(rankLists.description, `%${search}%`)
        )
      : undefined;

    // Build the where condition
    const whereCondition = searchCondition
      ? and(eq(rankLists.trackerId, trackerId), searchCondition)
      : eq(rankLists.trackerId, trackerId);

    // Get ranklists first
    const ranklistsList = await db
      .select({
        id: rankLists.id,
        trackerId: rankLists.trackerId,
        keyword: rankLists.keyword,
        description: rankLists.description,
        weightOfUpsolve: rankLists.weightOfUpsolve,
        order: rankLists.order,
        isActive: rankLists.isActive,
        considerStrictAttendance: rankLists.considerStrictAttendance,
        createdAt: rankLists.createdAt,
        updatedAt: rankLists.updatedAt,
      })
      .from(rankLists)
      .where(whereCondition)
      .orderBy(asc(rankLists.order), desc(rankLists.createdAt))
      .limit(pageSize)
      .offset(offset);

    // Get counts for each ranklist separately to avoid Cartesian product issues
    const ranklistsWithCounts = await Promise.all(
      ranklistsList.map(async (ranklist) => {
        const [eventCountResult, userCountResult] = await Promise.all([
          db
            .select({ count: count() })
            .from(eventRankList)
            .where(eq(eventRankList.rankListId, ranklist.id)),
          db
            .select({ count: count() })
            .from(rankListUser)
            .where(eq(rankListUser.rankListId, ranklist.id)),
        ]);

        return {
          ...ranklist,
          eventCount: eventCountResult[0]?.count || 0,
          userCount: userCountResult[0]?.count || 0,
        };
      })
    );

    // Get total count
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(rankLists)
      .where(whereCondition);

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      success: true,
      data: {
        ranklists: ranklistsWithCounts.map((ranklist) => ({
          ...ranklist,
          _count: {
            events: ranklist.eventCount,
            users: ranklist.userCount,
          },
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          pageSize,
        },
      },
    };
  } catch (error) {
    return handleDbError(error);
  }
}

// Event attachment functions
export async function attachEventToRanklist(
  ranklistId: number,
  eventId: number,
  weight: number
): Promise<ActionResult> {
  try {
    const permissionError = await validatePermission();
    if (permissionError) return permissionError;

    // Check if already attached
    const existing = await db
      .select({ eventId: eventRankList.eventId })
      .from(eventRankList)
      .where(
        and(
          eq(eventRankList.rankListId, ranklistId),
          eq(eventRankList.eventId, eventId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        error: "Event is already attached to this ranklist",
      };
    }

    await db.insert(eventRankList).values({
      rankListId: ranklistId,
      eventId,
      weight,
    });

    revalidatePath(`/admin/trackers/*/ranklists/${ranklistId}/events`);

    return {
      success: true,
      message: "Event attached successfully",
    };
  } catch (error) {
    return handleDbError(error);
  }
}

export async function detachEventFromRanklist(
  ranklistId: number,
  eventId: number
): Promise<ActionResult> {
  try {
    const permissionError = await validatePermission();
    if (permissionError) return permissionError;

    await db
      .delete(eventRankList)
      .where(
        and(
          eq(eventRankList.rankListId, ranklistId),
          eq(eventRankList.eventId, eventId)
        )
      );

    revalidatePath(`/admin/trackers/*/ranklists/${ranklistId}/events`);

    return {
      success: true,
      message: "Event detached successfully",
    };
  } catch (error) {
    return handleDbError(error);
  }
}

export async function updateEventWeight(
  ranklistId: number,
  eventId: number,
  weight: number
): Promise<ActionResult> {
  try {
    const permissionError = await validatePermission();
    if (permissionError) return permissionError;

    // Validate weight is between 0.0 and 1.0
    if (weight < 0.0 || weight > 1.0) {
      return { success: false, error: "Weight must be between 0.0 and 1.0" };
    }

    await db
      .update(eventRankList)
      .set({ weight })
      .where(
        and(
          eq(eventRankList.rankListId, ranklistId),
          eq(eventRankList.eventId, eventId)
        )
      );

    revalidatePath(`/admin/trackers/*/ranklists/${ranklistId}/events`);

    return {
      success: true,
      message: "Event weight updated successfully",
    };
  } catch (error) {
    return handleDbError(error);
  }
}

// User attachment functions
export async function attachUserToRanklist(
  ranklistId: number,
  userId: string,
  score: number = 0
): Promise<ActionResult> {
  try {
    const permissionError = await validatePermission();
    if (permissionError) return permissionError;

    // Check if already attached
    const existing = await db
      .select({ userId: rankListUser.userId })
      .from(rankListUser)
      .where(
        and(
          eq(rankListUser.rankListId, ranklistId),
          eq(rankListUser.userId, userId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        error: "User is already attached to this ranklist",
      };
    }

    await db.insert(rankListUser).values({
      rankListId: ranklistId,
      userId,
      score,
    });

    revalidatePath(`/admin/trackers/*/ranklists/${ranklistId}/users`);

    return {
      success: true,
      message: "User attached successfully",
    };
  } catch (error) {
    return handleDbError(error);
  }
}

export async function detachUserFromRanklist(
  ranklistId: number,
  userId: string
): Promise<ActionResult> {
  try {
    const permissionError = await validatePermission();
    if (permissionError) return permissionError;

    await db
      .delete(rankListUser)
      .where(
        and(
          eq(rankListUser.rankListId, ranklistId),
          eq(rankListUser.userId, userId)
        )
      );

    revalidatePath(`/admin/trackers/*/ranklists/${ranklistId}/users`);

    return {
      success: true,
      message: "User detached successfully",
    };
  } catch (error) {
    return handleDbError(error);
  }
}

export async function updateUserScore(
  ranklistId: number,
  userId: string,
  score: number
): Promise<ActionResult> {
  try {
    const permissionError = await validatePermission();
    if (permissionError) return permissionError;

    await db
      .update(rankListUser)
      .set({ score })
      .where(
        and(
          eq(rankListUser.rankListId, ranklistId),
          eq(rankListUser.userId, userId)
        )
      );

    revalidatePath(`/admin/trackers/*/ranklists/${ranklistId}/users`);

    return {
      success: true,
      message: "User score updated successfully",
    };
  } catch (error) {
    return handleDbError(error);
  }
}

// Get attached events for a ranklist
export async function getAttachedEvents(
  ranklistId: number
): Promise<ActionResult> {
  try {
    const permissionError = await validatePermission();
    if (permissionError) return permissionError;

    const attachedEvents = await db
      .select({
        eventId: eventRankList.eventId,
        weight: eventRankList.weight,
        event: {
          id: events.id,
          title: events.title,
          description: events.description,
          startingAt: events.startingAt,
          type: events.type,
        },
      })
      .from(eventRankList)
      .innerJoin(events, eq(events.id, eventRankList.eventId))
      .where(eq(eventRankList.rankListId, ranklistId))
      .orderBy(desc(events.startingAt));

    return {
      success: true,
      data: attachedEvents,
    };
  } catch (error) {
    return handleDbError(error);
  }
}

// Get available events to attach (not already attached)
export async function getAvailableEvents(
  ranklistId: number
): Promise<ActionResult> {
  try {
    const permissionError = await validatePermission();
    if (permissionError) return permissionError;

    // Get already attached event IDs
    const attachedEventIds = await db
      .select({ eventId: eventRankList.eventId })
      .from(eventRankList)
      .where(eq(eventRankList.rankListId, ranklistId));

    const attachedIds = attachedEventIds.map((item) => item.eventId);

    // Get events not already attached
    const availableEvents = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        startingAt: events.startingAt,
        type: events.type,
      })
      .from(events)
      .where(
        attachedIds.length > 0 ? notInArray(events.id, attachedIds) : undefined
      )
      .orderBy(desc(events.startingAt))
      .limit(50);

    return {
      success: true,
      data: availableEvents,
    };
  } catch (error) {
    return handleDbError(error);
  }
}

// Get attached users for a ranklist
export async function getAttachedUsers(
  ranklistId: number
): Promise<ActionResult> {
  try {
    const permissionError = await validatePermission();
    if (permissionError) return permissionError;

    const attachedUsers = await db
      .select({
        userId: rankListUser.userId,
        score: rankListUser.score,
        createdAt: rankListUser.createdAt,
        updatedAt: rankListUser.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          username: users.username,
          image: users.image,
          studentId: users.studentId,
          department: users.department,
        },
      })
      .from(rankListUser)
      .innerJoin(users, eq(users.id, rankListUser.userId))
      .where(eq(rankListUser.rankListId, ranklistId))
      .orderBy(desc(rankListUser.score), asc(users.name));

    return {
      success: true,
      data: attachedUsers,
    };
  } catch (error) {
    return handleDbError(error);
  }
}

// Get available users to attach (not already attached)
export async function getAvailableUsers(
  ranklistId: number,
  search?: string
): Promise<ActionResult> {
  try {
    const permissionError = await validatePermission();
    if (permissionError) return permissionError;

    // Get already attached user IDs
    const attachedUserIds = await db
      .select({ userId: rankListUser.userId })
      .from(rankListUser)
      .where(eq(rankListUser.rankListId, ranklistId));

    const attachedIds = attachedUserIds.map((item) => item.userId);

    // Build search condition
    const searchCondition = search
      ? or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(users.username, `%${search}%`),
          ilike(users.studentId, `%${search}%`)
        )
      : undefined;

    // Build where condition
    const whereCondition = and(
      attachedIds.length > 0 ? notInArray(users.id, attachedIds) : undefined,
      searchCondition
    );

    // Get users not already attached
    const availableUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        username: users.username,
        image: users.image,
        studentId: users.studentId,
        department: users.department,
      })
      .from(users)
      .where(whereCondition)
      .orderBy(asc(users.name))
      .limit(50);

    return {
      success: true,
      data: availableUsers,
    };
  } catch (error) {
    return handleDbError(error);
  }
}

// Get attendees from all events attached to a ranklist who are not already in the ranklist
export async function getEventAttendeesForRanklist(
  ranklistId: number
): Promise<ActionResult> {
  try {
    const permissionError = await validatePermission();
    if (permissionError) return permissionError;

    // Get all events attached to this ranklist
    const attachedEvents = await db
      .select({ eventId: eventRankList.eventId })
      .from(eventRankList)
      .where(eq(eventRankList.rankListId, ranklistId));

    if (attachedEvents.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const eventIds = attachedEvents.map((event) => event.eventId);

    // Get already attached user IDs to this ranklist
    const attachedUserIds = await db
      .select({ userId: rankListUser.userId })
      .from(rankListUser)
      .where(eq(rankListUser.rankListId, ranklistId));

    const attachedIds = attachedUserIds.map((item) => item.userId);

    // Get all attendees from the events who are not already in the ranklist
    const attendees = await db
      .selectDistinct({
        userId: users.id,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          username: users.username,
          image: users.image,
          studentId: users.studentId,
          department: users.department,
        },
        eventCount: sql<number>`count(distinct ${eventUserAttendance.eventId})`,
      })
      .from(eventUserAttendance)
      .innerJoin(users, eq(eventUserAttendance.userId, users.id))
      .where(
        and(
          sql`${eventUserAttendance.eventId} = ANY(${eventIds})`,
          attachedIds.length > 0 ? notInArray(users.id, attachedIds) : undefined
        )
      )
      .groupBy(users.id)
      .orderBy(desc(sql`count(distinct ${eventUserAttendance.eventId})`), asc(users.name));

    return {
      success: true,
      data: attendees,
    };
  } catch (error) {
    return handleDbError(error);
  }
}

// Bulk attach users from event attendance to ranklist
export async function bulkAttachEventAttendeesToRanklist(
  ranklistId: number,
  userIds: string[]
): Promise<ActionResult> {
  try {
    const permissionError = await validatePermission();
    if (permissionError) return permissionError;

    if (userIds.length === 0) {
      return {
        success: false,
        error: "No users selected",
      };
    }

    // Check which users are already attached
    const existingUsers = await db
      .select({ userId: rankListUser.userId })
      .from(rankListUser)
      .where(
        and(
          eq(rankListUser.rankListId, ranklistId),
          sql`${rankListUser.userId} = ANY(${userIds})`
        )
      );

    const existingUserIds = existingUsers.map((user) => user.userId);
    const newUserIds = userIds.filter((id) => !existingUserIds.includes(id));

    if (newUserIds.length === 0) {
      return {
        success: false,
        error: "All selected users are already attached to this ranklist",
      };
    }

    // Bulk insert new users with default score of 0
    const insertValues = newUserIds.map((userId) => ({
      rankListId: ranklistId,
      userId,
      score: 0,
    }));

    await db.insert(rankListUser).values(insertValues);

    revalidatePath(`/admin/trackers/*/ranklists/${ranklistId}/users`);

    return {
      success: true,
      message: `Successfully attached ${newUserIds.length} user${
        newUserIds.length !== 1 ? "s" : ""
      } to the ranklist`,
      data: { attachedCount: newUserIds.length, skippedCount: existingUserIds.length },
    };
  } catch (error) {
    return handleDbError(error);
  }
}
