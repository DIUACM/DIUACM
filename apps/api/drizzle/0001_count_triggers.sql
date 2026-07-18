-- Custom SQL migration file, put your code below! --

-- Keep `user_count` / `event_count` on `ranklists` in sync with the pivot tables
-- so read endpoints never COUNT at runtime. Backfill existing rows first, then
-- maintain via triggers.
--
-- NOTE: each CREATE TRIGGER is on a single line on purpose. Some SQLite runners
-- split a SQL blob on ";\n", which would chop a multi-line BEGIN…END body apart.
-- Keeping the body on one line leaves every inner ";" mid-line, so only the
-- trailing "END;" terminates the statement.
UPDATE `ranklists` SET `user_count` = (SELECT count(*) FROM `ranklist_user` WHERE `ranklist_user`.`ranklist_id` = `ranklists`.`id`), `event_count` = (SELECT count(*) FROM `ranklist_event` WHERE `ranklist_event`.`ranklist_id` = `ranklists`.`id`);
--> statement-breakpoint
CREATE TRIGGER `ranklist_user_after_insert` AFTER INSERT ON `ranklist_user` BEGIN UPDATE `ranklists` SET `user_count` = `user_count` + 1 WHERE `id` = NEW.`ranklist_id`; END;
--> statement-breakpoint
CREATE TRIGGER `ranklist_user_after_delete` AFTER DELETE ON `ranklist_user` BEGIN UPDATE `ranklists` SET `user_count` = `user_count` - 1 WHERE `id` = OLD.`ranklist_id`; END;
--> statement-breakpoint
CREATE TRIGGER `ranklist_user_after_update` AFTER UPDATE OF `ranklist_id` ON `ranklist_user` BEGIN UPDATE `ranklists` SET `user_count` = `user_count` - 1 WHERE `id` = OLD.`ranklist_id`; UPDATE `ranklists` SET `user_count` = `user_count` + 1 WHERE `id` = NEW.`ranklist_id`; END;
--> statement-breakpoint
CREATE TRIGGER `ranklist_event_after_insert` AFTER INSERT ON `ranklist_event` BEGIN UPDATE `ranklists` SET `event_count` = `event_count` + 1 WHERE `id` = NEW.`ranklist_id`; END;
--> statement-breakpoint
CREATE TRIGGER `ranklist_event_after_delete` AFTER DELETE ON `ranklist_event` BEGIN UPDATE `ranklists` SET `event_count` = `event_count` - 1 WHERE `id` = OLD.`ranklist_id`; END;
--> statement-breakpoint
CREATE TRIGGER `ranklist_event_after_update` AFTER UPDATE OF `ranklist_id` ON `ranklist_event` BEGIN UPDATE `ranklists` SET `event_count` = `event_count` - 1 WHERE `id` = OLD.`ranklist_id`; UPDATE `ranklists` SET `event_count` = `event_count` + 1 WHERE `id` = NEW.`ranklist_id`; END;
