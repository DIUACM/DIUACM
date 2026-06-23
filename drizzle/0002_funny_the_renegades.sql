CREATE TABLE `event_attendance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_attendance_event_user_unique` ON `event_attendance` (`event_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `event_attendance_event_id_idx` ON `event_attendance` (`event_id`);--> statement-breakpoint
CREATE INDEX `event_attendance_user_id_idx` ON `event_attendance` (`user_id`);--> statement-breakpoint
CREATE TABLE `event_media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`type` text NOT NULL,
	`key` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `event_media_event_id_idx` ON `event_media` (`event_id`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`type` text DEFAULT 'other' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`starting_at` integer NOT NULL,
	`ending_at` integer NOT NULL,
	`event_link` text,
	`event_password` text,
	`participation_scope` text DEFAULT 'open_for_all' NOT NULL,
	`open_for_attendance` integer DEFAULT false NOT NULL,
	`strict_attendance` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_type_idx` ON `events` (`type`);--> statement-breakpoint
CREATE INDEX `events_scope_idx` ON `events` (`participation_scope`);--> statement-breakpoint
CREATE INDEX `events_status_idx` ON `events` (`status`);--> statement-breakpoint
CREATE INDEX `events_starting_at_idx` ON `events` (`starting_at`);