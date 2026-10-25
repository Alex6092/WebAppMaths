CREATE TABLE `attempt` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`child_id` integer NOT NULL,
	`plugin_id` text NOT NULL,
	`plugin_version` integer NOT NULL,
	`level` integer NOT NULL,
	`seed` integer NOT NULL,
	`answers` text NOT NULL,
	`first_try_correct` integer NOT NULL,
	`solved` integer NOT NULL,
	`tries` integer NOT NULL,
	`score` real NOT NULL,
	`duration_ms` integer NOT NULL,
	`coins` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `practice_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attempt_child_idx` ON `attempt` (`child_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `attempt_child_plugin_idx` ON `attempt` (`child_id`,`plugin_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `attempt_session_question_uq` ON `attempt` (`session_id`,`plugin_id`,`seed`);--> statement-breakpoint
CREATE TABLE `auth_session` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` integer NOT NULL,
	`parent_user_id` integer NOT NULL,
	`parent_verified_at` integer,
	`active_child_id` integer,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `family`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_user_id`) REFERENCES `parent_user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`active_child_id`) REFERENCES `child`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `auth_session_user_idx` ON `auth_session` (`parent_user_id`);--> statement-breakpoint
CREATE TABLE `child` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`family_id` integer NOT NULL,
	`first_name` text NOT NULL,
	`avatar` text NOT NULL,
	`grade` text NOT NULL,
	`theme_id` text NOT NULL,
	`coins` integer DEFAULT 0 NOT NULL,
	`settings` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `family`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exercise_state` (
	`child_id` integer NOT NULL,
	`plugin_id` text NOT NULL,
	`level` integer NOT NULL,
	`recent` text NOT NULL,
	`consecutive_errors` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`child_id`, `plugin_id`),
	FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `family` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invitation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code_hash` text NOT NULL,
	`role` text NOT NULL,
	`family_id` integer,
	`created_by` integer,
	`note` text,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`used_by` integer,
	FOREIGN KEY (`family_id`) REFERENCES `family`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `parent_user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`used_by`) REFERENCES `parent_user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitation_code_hash_unique` ON `invitation` (`code_hash`);--> statement-breakpoint
CREATE TABLE `parent_user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`family_id` integer NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `family`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parent_user_email_unique` ON `parent_user` (`email`);--> statement-breakpoint
CREATE TABLE `practice_session` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`child_id` integer NOT NULL,
	`mode` text NOT NULL,
	`selection` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`n_questions` integer DEFAULT 0 NOT NULL,
	`n_first_try` integer DEFAULT 0 NOT NULL,
	`coins_earned` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `practice_session_child_idx` ON `practice_session` (`child_id`,`started_at`);--> statement-breakpoint
CREATE TABLE `reward_owned` (
	`child_id` integer NOT NULL,
	`theme_id` text NOT NULL,
	`reward_id` text NOT NULL,
	`acquired_at` integer NOT NULL,
	PRIMARY KEY(`child_id`, `theme_id`, `reward_id`),
	FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON UPDATE no action ON DELETE cascade
);
