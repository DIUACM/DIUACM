ALTER TABLE `ranklists` ADD `position` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `trackers` ADD `position` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `trackers` SET `position` = (SELECT COUNT(*) FROM `trackers` t2 WHERE t2.id > `trackers`.id);--> statement-breakpoint
UPDATE `ranklists` SET `position` = (SELECT COUNT(*) FROM `ranklists` r2 WHERE r2.tracker_id = `ranklists`.tracker_id AND r2.keyword > `ranklists`.keyword);