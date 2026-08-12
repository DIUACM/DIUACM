CREATE TABLE `incentive_applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`full_name` text NOT NULL,
	`student_id` text NOT NULL,
	`batch` text NOT NULL,
	`email` text NOT NULL,
	`current_semester` text NOT NULL,
	`phone_number` text NOT NULL,
	`courses` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `incentive_applications_user_id_unique` ON `incentive_applications` (`user_id`);--> statement-breakpoint
CREATE INDEX `incentive_applications_created_at_idx` ON `incentive_applications` (`created_at`);