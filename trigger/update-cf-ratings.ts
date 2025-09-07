import { logger, schedules } from "@trigger.dev/sdk/v3";
import { db } from "../db/drizzle";
import { users as usersTable } from "../db/schema";
import { isNotNull, eq } from "drizzle-orm";

interface CodeforcesUserInfo {
  handle: string;
  rating?: number;
  maxRating?: number;
}

interface CodeforcesApiResponse {
  status: string;
  result: CodeforcesUserInfo[];
}

export const updateCodeforcesRatings = schedules.task({
  id: "update-codeforces-ratings",
  // Run every 6 hours
  cron: "0 */6 * * *",
  // Set a maximum duration to prevent tasks from running indefinitely
  maxDuration: 300, // 5 minutes
  run: async (payload) => {
    try {
      logger.log("Starting Codeforces usernames cleanup and ratings update", {
        timestamp: payload.timestamp,
      });

      // Get all users who have a Codeforces handle
      const users = await db
        .select({
          id: usersTable.id,
          codeforcesHandle: usersTable.codeforcesHandle,
          maxCfRating: usersTable.maxCfRating,
        })
        .from(usersTable)
        .where(isNotNull(usersTable.codeforcesHandle));

      logger.log(`Found ${users.length} users with Codeforces handles`);

      if (users.length === 0) {
        logger.log("No users with Codeforces handles found");
        return;
      }

      let updatedCount = 0;
      let cleanedHandles = 0;
      let skippedHandles = 0;

      // Process each user individually (like the Laravel implementation)
      for (const user of users) {
        if (!user.codeforcesHandle) continue;

        // Clean up the handle if it's a URL
        let cfHandle = user.codeforcesHandle;

        if (cfHandle.startsWith("https")) {
          try {
            // Extract handle from URL, similar to Laravel's approach
            const urlParts = cfHandle.split("/");
            cfHandle = decodeURIComponent(urlParts[4] || "");

            // Update the handle in database to the cleaned version
            await db
              .update(usersTable)
              .set({ codeforcesHandle: cfHandle })
              .where(eq(usersTable.id, user.id));

            cleanedHandles++;
            logger.log(
              `Cleaned up handle for user ${user.id}: ${user.codeforcesHandle} -> ${cfHandle}`
            );
          } catch (error) {
            logger.error(`Error cleaning URL handle: ${cfHandle}`, { error });
            continue;
          }
        }

        logger.log(`Checking Codeforces handle: ${cfHandle}`);

        try {
          // Fetch user info from Codeforces API
          const response = await fetch(
            `https://codeforces.com/api/user.info?handles=${cfHandle}`
          );

          if (!response.ok) {
            logger.warn(
              `API request failed for ${cfHandle}. Keeping existing handle.`
            );

            // Don't remove the handle, just skip this user
            skippedHandles++;
            continue;
          }

          const data = (await response.json()) as CodeforcesApiResponse;

          if (data.status !== "OK" || !data.result || !data.result[0]) {
            logger.warn(`Invalid handle: ${cfHandle}. Keeping existing handle.`);

            // Don't remove the handle, just skip this user
            skippedHandles++;
            continue;
          }

          const cfUser = data.result[0];
          const maxRating = cfUser.maxRating || cfUser.rating || 0;

          // Update with the proper handle case from API and the max rating
          await db
            .update(usersTable)
            .set({
              codeforcesHandle: cfUser.handle, // Use the proper case from API
              maxCfRating: maxRating,
            })
            .where(eq(usersTable.id, user.id));

          logger.log(`Updated handle and rating for ${cfUser.handle}`, {
            oldHandle: user.codeforcesHandle,
            newHandle: cfUser.handle,
            oldRating: user.maxCfRating,
            newRating: maxRating,
          });

          updatedCount++;

          // Add a small delay to prevent rate limiting
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error) {
          logger.error(`Error processing handle: ${cfHandle}`, { error });
        }
      }

      logger.log(`Codeforces usernames cleanup and ratings update completed`, {
        processed: users.length,
        updated: updatedCount,
        cleanedHandles,
        skippedHandles,
      });
    } catch (error) {
      logger.error("Error in Codeforces cleanup task", { error });
    }
  },
});
