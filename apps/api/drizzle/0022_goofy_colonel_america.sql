CREATE TABLE `upstream_backoffs` (
	`upstream` text PRIMARY KEY NOT NULL,
	`blocked_until` integer NOT NULL,
	`failures` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`updated_at` integer NOT NULL
);
