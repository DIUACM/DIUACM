ALTER TABLE `event_media` RENAME COLUMN "position" TO "order";--> statement-breakpoint
ALTER TABLE `ranklists` RENAME COLUMN "position" TO "order";--> statement-breakpoint
ALTER TABLE `trackers` RENAME COLUMN "position" TO "order";--> statement-breakpoint
ALTER TABLE `events` ADD `attendance_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `performance_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint

-- Backfill the new event counters before enabling trigger maintenance.
UPDATE `events` SET `attendance_count` = (SELECT count(*) FROM `event_attendance` WHERE `event_attendance`.`event_id` = `events`.`id`), `performance_count` = (SELECT count(*) FROM `event_performance` WHERE `event_performance`.`event_id` = `events`.`id`);--> statement-breakpoint

-- Keep each trigger body on one line so SQL runners that split on statement
-- boundaries do not split the inner BEGIN...END statements.
CREATE TRIGGER `event_attendance_after_insert` AFTER INSERT ON `event_attendance` BEGIN UPDATE `events` SET `attendance_count` = `attendance_count` + 1 WHERE `id` = NEW.`event_id`; END;--> statement-breakpoint
CREATE TRIGGER `event_attendance_after_delete` AFTER DELETE ON `event_attendance` BEGIN UPDATE `events` SET `attendance_count` = `attendance_count` - 1 WHERE `id` = OLD.`event_id`; END;--> statement-breakpoint
CREATE TRIGGER `event_attendance_after_update` AFTER UPDATE OF `event_id` ON `event_attendance` WHEN NEW.`event_id` <> OLD.`event_id` BEGIN UPDATE `events` SET `attendance_count` = `attendance_count` - 1 WHERE `id` = OLD.`event_id`; UPDATE `events` SET `attendance_count` = `attendance_count` + 1 WHERE `id` = NEW.`event_id`; END;--> statement-breakpoint
CREATE TRIGGER `event_performance_after_insert` AFTER INSERT ON `event_performance` BEGIN UPDATE `events` SET `performance_count` = `performance_count` + 1 WHERE `id` = NEW.`event_id`; END;--> statement-breakpoint
CREATE TRIGGER `event_performance_after_delete` AFTER DELETE ON `event_performance` BEGIN UPDATE `events` SET `performance_count` = `performance_count` - 1 WHERE `id` = OLD.`event_id`; END;--> statement-breakpoint
CREATE TRIGGER `event_performance_after_update` AFTER UPDATE OF `event_id` ON `event_performance` WHEN NEW.`event_id` <> OLD.`event_id` BEGIN UPDATE `events` SET `performance_count` = `performance_count` - 1 WHERE `id` = OLD.`event_id`; UPDATE `events` SET `performance_count` = `performance_count` + 1 WHERE `id` = NEW.`event_id`; END;
