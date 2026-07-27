CREATE TABLE `event_sync_state` (
	`event_id` integer PRIMARY KEY NOT NULL,
	`last_synced_at` integer,
	`last_sync_error` text,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
