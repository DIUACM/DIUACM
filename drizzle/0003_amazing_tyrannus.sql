CREATE TABLE `event_performance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`rank` integer NOT NULL,
	`solve_count` integer DEFAULT 0 NOT NULL,
	`upsolve_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_performance_event_user_unique` ON `event_performance` (`event_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `event_performance_event_id_idx` ON `event_performance` (`event_id`);--> statement-breakpoint
CREATE INDEX `event_performance_user_id_idx` ON `event_performance` (`user_id`);