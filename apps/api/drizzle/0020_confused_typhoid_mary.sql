ALTER TABLE `users` ADD `is_banned` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `ban_reason` text;
--> statement-breakpoint
-- A ban is part of ranking state, not merely presentation. Recalculate the
-- affected user's stored score and every affected rank immediately on both ban
-- and unban so every API (and future consumer) observes the same invariant.
CREATE TRIGGER `rl_ban_state_au` AFTER UPDATE OF `is_banned` ON `users` WHEN OLD.is_banned <> NEW.is_banned BEGIN UPDATE ranklist_user SET score = CASE WHEN NEW.is_banned = 1 THEN -1 ELSE (SELECT COALESCE(SUM(CASE WHEN rl.consider_strict_attendance = 1 AND e.strict_attendance = 1 AND NOT EXISTS (SELECT 1 FROM event_attendance ea WHERE ea.event_id = ep.event_id AND ea.user_id = ep.user_id) THEN (ep.solve_count + ep.upsolve_count) * re.weight * rl.upsolve_weight ELSE ep.solve_count * re.weight + ep.upsolve_count * re.weight * rl.upsolve_weight END), 0) FROM ranklist_event re JOIN events e ON e.id = re.event_id JOIN ranklists rl ON rl.id = re.ranklist_id JOIN event_performance ep ON ep.event_id = re.event_id AND ep.user_id = ranklist_user.user_id WHERE re.ranklist_id = ranklist_user.ranklist_id) END WHERE user_id = NEW.id; UPDATE ranklist_user SET rank = (1 + (SELECT COUNT(*) FROM ranklist_user r2 WHERE r2.ranklist_id = ranklist_user.ranklist_id AND r2.score > ranklist_user.score)) WHERE ranklist_id IN (SELECT affected.ranklist_id FROM ranklist_user affected WHERE affected.user_id = NEW.id); END;
--> statement-breakpoint
-- Existing score triggers still run normally. If one later touches a banned
-- member (for example during a scheduled sync), this narrow guard restores -1
-- and re-ranks only that member's ranklist.
CREATE TRIGGER `rl_banned_score_guard_au` AFTER UPDATE OF `score` ON `ranklist_user` WHEN NEW.score <> -1 AND EXISTS (SELECT 1 FROM users u WHERE u.id = NEW.user_id AND u.is_banned = 1) BEGIN UPDATE ranklist_user SET score = -1 WHERE ranklist_id = NEW.ranklist_id AND user_id = NEW.user_id; UPDATE ranklist_user SET rank = (1 + (SELECT COUNT(*) FROM ranklist_user r2 WHERE r2.ranklist_id = ranklist_user.ranklist_id AND r2.score > ranklist_user.score)) WHERE ranklist_id = NEW.ranklist_id; END;
