CREATE TABLE `user_permissions` (
	`user_id` integer NOT NULL,
	`permission` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`user_id`, `permission`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_permissions_user_id_idx` ON `user_permissions` (`user_id`);--> statement-breakpoint
INSERT INTO `user_permissions` (`user_id`, `permission`)
SELECT `id`, p.`permission`
FROM `users`
CROSS JOIN (
	SELECT 'manage_users' AS `permission`
	UNION ALL SELECT 'manage_events'
	UNION ALL SELECT 'manage_attendance'
	UNION ALL SELECT 'manage_trackers'
) AS p
WHERE `role` = 'admin';--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `role`;