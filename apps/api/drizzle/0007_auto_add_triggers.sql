-- Custom SQL migration file, put your code below! --

-- Keep ranklist membership in sync with participation, entirely in the database.
--
-- When `ranklists.auto_add_users` = 1, membership is defined as: every user with an
-- `event_performance` or `event_attendance` row on an event attached to the ranklist.
--   * participation appears (perf/attendance INSERT)         -> add the user
--   * an event is attached (ranklist_event INSERT)           -> backfill its participants
--   * the flag is switched on                                -> backfill all participants
--   * participation disappears (perf/attendance/event DELETE)-> remove users with no
--     remaining participation in ANY of the ranklist's events
--   * the flag is switched off                               -> remove all auto members
--
-- Provenance: rows inserted here carry `ranklist_user.auto_added` = 1 and only such rows
-- are ever deleted here. Manually added members (auto_added = 0, the application default)
-- are never touched, and an explicit admin add resets auto_added to 0 (see the admin
-- ranklist-users route). `is_locked` is ignored, consistent with scoring.
--
-- Downstream consistency is free: the INSERTs/DELETEs on ranklist_user fire the existing
-- count triggers (user_count) and score triggers (rl_score_ru_ai/ad: score + re-rank).
-- No recursion: those downstream triggers only UPDATE ranklists.user_count and
-- ranklist_user.score/rank, and every trigger below either targets a different table or
-- is scoped `OF auto_add_users`, so nothing here can re-fire itself.
--
-- Performance: every lookup rides an existing index — ranklist_event PK /
-- ranklist_event_event_id_idx, the (event_id, user_id) unique indexes on both
-- participation tables, and the ranklist_user PK. Per-row adds are O(1) lookups plus the
-- existing per-member score/re-rank trigger; bulk backfills cost the same as the
-- score-triggers migration backfill and only run on admin actions (flag toggle / event
-- attach). `auto_added` needs no index: it is only filtered under a ranklist_id PK prefix.
--
-- NOTE: each CREATE TRIGGER is on a single line on purpose (see the count-triggers
-- migration) — some SQLite runners split a SQL blob on ";\n", which would chop a
-- multi-line BEGIN…END body apart. Trigger bodies stick to plain-join INSERT…SELECT /
-- DELETE forms (no UNION/UPSERT), which SQLite supports inside triggers.

-- No backfill needed: auto_add_users defaults to 0 for all existing ranklists.

CREATE TRIGGER `rl_autoadd_ep_ai` AFTER INSERT ON `event_performance` BEGIN INSERT OR IGNORE INTO ranklist_user (ranklist_id, user_id, auto_added) SELECT re.ranklist_id, NEW.user_id, 1 FROM ranklist_event re JOIN ranklists rl ON rl.id = re.ranklist_id WHERE re.event_id = NEW.event_id AND rl.auto_add_users = 1; END;
--> statement-breakpoint
CREATE TRIGGER `rl_autoadd_ea_ai` AFTER INSERT ON `event_attendance` BEGIN INSERT OR IGNORE INTO ranklist_user (ranklist_id, user_id, auto_added) SELECT re.ranklist_id, NEW.user_id, 1 FROM ranklist_event re JOIN ranklists rl ON rl.id = re.ranklist_id WHERE re.event_id = NEW.event_id AND rl.auto_add_users = 1; END;
--> statement-breakpoint
CREATE TRIGGER `rl_autoadd_ep_ad` AFTER DELETE ON `event_performance` BEGIN DELETE FROM ranklist_user WHERE auto_added = 1 AND user_id = OLD.user_id AND ranklist_id IN (SELECT ranklist_id FROM ranklist_event WHERE event_id = OLD.event_id) AND NOT EXISTS (SELECT 1 FROM ranklist_event re JOIN event_performance ep ON ep.event_id = re.event_id AND ep.user_id = ranklist_user.user_id WHERE re.ranklist_id = ranklist_user.ranklist_id) AND NOT EXISTS (SELECT 1 FROM ranklist_event re JOIN event_attendance ea ON ea.event_id = re.event_id AND ea.user_id = ranklist_user.user_id WHERE re.ranklist_id = ranklist_user.ranklist_id); END;
--> statement-breakpoint
CREATE TRIGGER `rl_autoadd_ea_ad` AFTER DELETE ON `event_attendance` BEGIN DELETE FROM ranklist_user WHERE auto_added = 1 AND user_id = OLD.user_id AND ranklist_id IN (SELECT ranklist_id FROM ranklist_event WHERE event_id = OLD.event_id) AND NOT EXISTS (SELECT 1 FROM ranklist_event re JOIN event_performance ep ON ep.event_id = re.event_id AND ep.user_id = ranklist_user.user_id WHERE re.ranklist_id = ranklist_user.ranklist_id) AND NOT EXISTS (SELECT 1 FROM ranklist_event re JOIN event_attendance ea ON ea.event_id = re.event_id AND ea.user_id = ranklist_user.user_id WHERE re.ranklist_id = ranklist_user.ranklist_id); END;
--> statement-breakpoint
CREATE TRIGGER `rl_autoadd_re_ai` AFTER INSERT ON `ranklist_event` BEGIN INSERT OR IGNORE INTO ranklist_user (ranklist_id, user_id, auto_added) SELECT NEW.ranklist_id, ep.user_id, 1 FROM event_performance ep JOIN ranklists rl ON rl.id = NEW.ranklist_id AND rl.auto_add_users = 1 WHERE ep.event_id = NEW.event_id; INSERT OR IGNORE INTO ranklist_user (ranklist_id, user_id, auto_added) SELECT NEW.ranklist_id, ea.user_id, 1 FROM event_attendance ea JOIN ranklists rl ON rl.id = NEW.ranklist_id AND rl.auto_add_users = 1 WHERE ea.event_id = NEW.event_id; END;
--> statement-breakpoint
CREATE TRIGGER `rl_autoadd_re_ad` AFTER DELETE ON `ranklist_event` BEGIN DELETE FROM ranklist_user WHERE ranklist_id = OLD.ranklist_id AND auto_added = 1 AND NOT EXISTS (SELECT 1 FROM ranklist_event re JOIN event_performance ep ON ep.event_id = re.event_id AND ep.user_id = ranklist_user.user_id WHERE re.ranklist_id = ranklist_user.ranklist_id) AND NOT EXISTS (SELECT 1 FROM ranklist_event re JOIN event_attendance ea ON ea.event_id = re.event_id AND ea.user_id = ranklist_user.user_id WHERE re.ranklist_id = ranklist_user.ranklist_id); END;
--> statement-breakpoint
CREATE TRIGGER `rl_autoadd_rl_au_on` AFTER UPDATE OF `auto_add_users` ON `ranklists` WHEN NEW.auto_add_users = 1 AND OLD.auto_add_users = 0 BEGIN INSERT OR IGNORE INTO ranklist_user (ranklist_id, user_id, auto_added) SELECT re.ranklist_id, ep.user_id, 1 FROM ranklist_event re JOIN event_performance ep ON ep.event_id = re.event_id WHERE re.ranklist_id = NEW.id; INSERT OR IGNORE INTO ranklist_user (ranklist_id, user_id, auto_added) SELECT re.ranklist_id, ea.user_id, 1 FROM ranklist_event re JOIN event_attendance ea ON ea.event_id = re.event_id WHERE re.ranklist_id = NEW.id; END;
--> statement-breakpoint
CREATE TRIGGER `rl_autoadd_rl_au_off` AFTER UPDATE OF `auto_add_users` ON `ranklists` WHEN NEW.auto_add_users = 0 AND OLD.auto_add_users = 1 BEGIN DELETE FROM ranklist_user WHERE ranklist_id = NEW.id AND auto_added = 1; END;
