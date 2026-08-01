-- Preserve every existing event while resolving exact duplicate links: the
-- oldest event keeps the link and later duplicates become unlinked.
UPDATE `events`
SET `event_link` = NULL
WHERE `event_link` IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM `events` AS `earlier`
    WHERE `earlier`.`event_link` = `events`.`event_link`
      AND `earlier`.`id` < `events`.`id`
  );
--> statement-breakpoint
CREATE UNIQUE INDEX `events_event_link_unique` ON `events` (`event_link`);
