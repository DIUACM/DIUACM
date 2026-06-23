CREATE TABLE `ranklist_event` (
	`ranklist_id` integer NOT NULL,
	`event_id` integer NOT NULL,
	`weight` real DEFAULT 0 NOT NULL,
	PRIMARY KEY(`ranklist_id`, `event_id`),
	FOREIGN KEY (`ranklist_id`) REFERENCES `ranklists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "ranklist_event_weight_range" CHECK("ranklist_event"."weight" >= 0 AND "ranklist_event"."weight" <= 1)
);
--> statement-breakpoint
CREATE INDEX `ranklist_event_event_id_idx` ON `ranklist_event` (`event_id`);--> statement-breakpoint
CREATE TABLE `ranklist_user` (
	`ranklist_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`score` real DEFAULT 0 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`ranklist_id`, `user_id`),
	FOREIGN KEY (`ranklist_id`) REFERENCES `ranklists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ranklist_user_user_id_idx` ON `ranklist_user` (`user_id`);--> statement-breakpoint
CREATE TABLE `ranklists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tracker_id` integer NOT NULL,
	`keyword` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`upsolve_weight` real DEFAULT 0 NOT NULL,
	`is_locked` integer DEFAULT false NOT NULL,
	`consider_strict_attendance` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tracker_id`) REFERENCES `trackers`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "ranklists_upsolve_weight_range" CHECK("ranklists"."upsolve_weight" >= 0 AND "ranklists"."upsolve_weight" <= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ranklists_tracker_keyword_unique` ON `ranklists` (`tracker_id`,`keyword`);--> statement-breakpoint
CREATE INDEX `ranklists_tracker_id_idx` ON `ranklists` (`tracker_id`);--> statement-breakpoint
CREATE INDEX `ranklists_status_idx` ON `ranklists` (`status`);--> statement-breakpoint
CREATE TABLE `trackers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`slug` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trackers_slug_unique` ON `trackers` (`slug`);--> statement-breakpoint
CREATE INDEX `trackers_status_idx` ON `trackers` (`status`);--> statement-breakpoint
ALTER TABLE `event_performance` ADD `participation` integer DEFAULT false NOT NULL;