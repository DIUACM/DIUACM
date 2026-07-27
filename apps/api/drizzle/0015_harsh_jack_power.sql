DROP INDEX `user_handles_type_handle_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_handles_type_handle_unique` ON `user_handles` (`type`,"handle" COLLATE NOCASE);