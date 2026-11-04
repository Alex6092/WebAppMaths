ALTER TABLE `parent_user` ADD `last_seen_at` integer;--> statement-breakpoint
-- Dernière activité connue : la session la plus récente du compte, sinon sa création.
UPDATE `parent_user` SET `last_seen_at` = coalesce((SELECT max(`last_seen_at`) FROM `auth_session` WHERE `auth_session`.`parent_user_id` = `parent_user`.`id`), `created_at`);
