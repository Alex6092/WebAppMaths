CREATE TABLE `evaluation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`child_id` integer NOT NULL,
	`title` text NOT NULL,
	`notions` text NOT NULL,
	`per_notion` integer NOT NULL,
	`items` text NOT NULL,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `evaluation_child_idx` ON `evaluation` (`child_id`,`created_at`);