ALTER TABLE `ranklist_user` ADD `auto_added` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `ranklists` ADD `auto_add_users` integer DEFAULT false NOT NULL;