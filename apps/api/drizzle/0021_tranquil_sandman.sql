DROP INDEX `users_username_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` ("username" COLLATE NOCASE);