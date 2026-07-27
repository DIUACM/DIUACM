CREATE TABLE `cron_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job` text NOT NULL,
	`started_at` integer NOT NULL,
	`duration_ms` integer NOT NULL,
	`status` text NOT NULL,
	`faults` text,
	`rows_written` integer,
	`errors` integer,
	`summary` text
);
--> statement-breakpoint
CREATE INDEX `cron_runs_job_started_idx` ON `cron_runs` (`job`,`started_at`);