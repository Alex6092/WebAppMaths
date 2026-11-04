CREATE TABLE `class_notion_setting` (
	`class_id` integer NOT NULL,
	`notion_id` text NOT NULL,
	`active` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`class_id`, `notion_id`),
	FOREIGN KEY (`class_id`) REFERENCES `classroom`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `classroom_teacher` (
	`class_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	PRIMARY KEY(`class_id`, `user_id`),
	FOREIGN KEY (`class_id`) REFERENCES `classroom`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `parent_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `classroom_teacher_user_idx` ON `classroom_teacher` (`user_id`);--> statement-breakpoint
CREATE TABLE `classroom` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`name` text NOT NULL,
	`grades` text NOT NULL,
	`school_year` text NOT NULL,
	`focus_notions` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `classroom_school_idx` ON `classroom` (`school_id`);--> statement-breakpoint
CREATE TABLE `notion_assessment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`child_id` integer NOT NULL,
	`notion_id` text NOT NULL,
	`result` text NOT NULL,
	`assessed_on` text NOT NULL,
	`title` text NOT NULL,
	`batch` text NOT NULL,
	`class_id` integer,
	`created_by` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classroom`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `parent_user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `notion_assessment_child_idx` ON `notion_assessment` (`child_id`,`notion_id`);--> statement-breakpoint
CREATE INDEX `notion_assessment_class_idx` ON `notion_assessment` (`class_id`,`batch`);--> statement-breakpoint
CREATE TABLE `school_member` (
	`school_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`school_id`, `user_id`),
	FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `parent_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `school_member_user_idx` ON `school_member` (`user_id`);--> statement-breakpoint
CREATE TABLE `school` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`city` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_auth_session` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` integer,
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
INSERT INTO `__new_auth_session`("id", "family_id", "parent_user_id", "parent_verified_at", "active_child_id", "user_agent", "created_at", "last_seen_at", "expires_at") SELECT "id", "family_id", "parent_user_id", "parent_verified_at", "active_child_id", "user_agent", "created_at", "last_seen_at", "expires_at" FROM `auth_session`;--> statement-breakpoint
DROP TABLE `auth_session`;--> statement-breakpoint
ALTER TABLE `__new_auth_session` RENAME TO `auth_session`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `auth_session_user_idx` ON `auth_session` (`parent_user_id`);--> statement-breakpoint
CREATE TABLE `__new_child` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`family_id` integer,
	`class_id` integer,
	`first_name` text NOT NULL,
	`last_name` text,
	`avatar` text NOT NULL,
	`grade` text NOT NULL,
	`theme_id` text NOT NULL,
	`coins` integer DEFAULT 0 NOT NULL,
	`settings` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `family`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classroom`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_child`("id", "family_id", "first_name", "avatar", "grade", "theme_id", "coins", "settings", "created_at") SELECT "id", "family_id", "first_name", "avatar", "grade", "theme_id", "coins", "settings", "created_at" FROM `child`;--> statement-breakpoint
DROP TABLE `child`;--> statement-breakpoint
ALTER TABLE `__new_child` RENAME TO `child`;--> statement-breakpoint
CREATE INDEX `child_family_idx` ON `child` (`family_id`);--> statement-breakpoint
CREATE INDEX `child_class_idx` ON `child` (`class_id`);--> statement-breakpoint
CREATE TABLE `__new_parent_user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`family_id` integer,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `family`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_parent_user`("id", "family_id", "email", "password_hash", "role", "created_at") SELECT "id", "family_id", "email", "password_hash", "role", "created_at" FROM `parent_user`;--> statement-breakpoint
DROP TABLE `parent_user`;--> statement-breakpoint
ALTER TABLE `__new_parent_user` RENAME TO `parent_user`;--> statement-breakpoint
CREATE UNIQUE INDEX `parent_user_email_unique` ON `parent_user` (`email`);--> statement-breakpoint
ALTER TABLE `assignment` ADD `batch` text;--> statement-breakpoint
ALTER TABLE `assignment` ADD `class_id` integer REFERENCES classroom(id) ON UPDATE no action ON DELETE set null;--> statement-breakpoint
ALTER TABLE `assignment` ADD `created_by` integer REFERENCES parent_user(id) ON UPDATE no action ON DELETE set null;--> statement-breakpoint
CREATE INDEX `assignment_class_idx` ON `assignment` (`class_id`,`batch`);--> statement-breakpoint
ALTER TABLE `invitation` ADD `school_id` integer REFERENCES school(id) ON UPDATE no action ON DELETE cascade;--> statement-breakpoint
ALTER TABLE `invitation` ADD `child_id` integer REFERENCES child(id) ON UPDATE no action ON DELETE cascade;