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
CREATE TABLE `event_performance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`position` integer,
	`solve_count` integer DEFAULT 0 NOT NULL,
	`upsolve_count` integer DEFAULT 0 NOT NULL,
	`participation` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_performance_event_user_unique` ON `event_performance` (`event_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `event_performance_event_id_idx` ON `event_performance` (`event_id`);--> statement-breakpoint
CREATE INDEX `event_performance_user_id_idx` ON `event_performance` (`user_id`);--> statement-breakpoint
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
CREATE INDEX `events_starting_at_idx` ON `events` (`starting_at`);--> statement-breakpoint
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
	`rank` integer DEFAULT 0 NOT NULL,
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
	`user_count` integer DEFAULT 0 NOT NULL,
	`event_count` integer DEFAULT 0 NOT NULL,
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
CREATE TABLE `user_handles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`handle` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_handles_user_type_unique` ON `user_handles` (`user_id`,`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_handles_type_handle_unique` ON `user_handles` (`type`,`handle`);--> statement-breakpoint
CREATE INDEX `user_handles_user_id_idx` ON `user_handles` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`username` text NOT NULL,
	`student_id` text,
	`password_hash` text,
	`image_key` text,
	`max_cf_rating` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_student_id_unique` ON `users` (`student_id`);