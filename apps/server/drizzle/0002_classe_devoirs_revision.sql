CREATE TABLE `assignment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`child_id` integer NOT NULL,
	`title` text NOT NULL,
	`notions` text NOT NULL,
	`questions` integer NOT NULL,
	`due_on` text NOT NULL,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `assignment_child_idx` ON `assignment` (`child_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `notion_review` (
	`child_id` integer NOT NULL,
	`notion_id` text NOT NULL,
	`box` integer NOT NULL,
	`due_at` integer NOT NULL,
	`reviewed_at` integer,
	PRIMARY KEY(`child_id`, `notion_id`),
	FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notion_setting` (
	`child_id` integer NOT NULL,
	`notion_id` text NOT NULL,
	`active` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`child_id`, `notion_id`),
	FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `attempt` ADD `first_try_ms` integer;