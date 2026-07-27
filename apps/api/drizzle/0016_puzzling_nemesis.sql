CREATE TABLE `admin_notices` (
	`key` text PRIMARY KEY NOT NULL,
	`first_seen_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`last_sent_at` integer,
	`occurrences` integer DEFAULT 0 NOT NULL,
	`last_detail` text
);
