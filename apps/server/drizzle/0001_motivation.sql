CREATE TABLE `badge` (
	`child_id` integer NOT NULL,
	`badge_id` text NOT NULL,
	`earned_at` integer NOT NULL,
	PRIMARY KEY(`child_id`, `badge_id`),
	FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `theme_owned` (
	`child_id` integer NOT NULL,
	`theme_id` text NOT NULL,
	`unlocked_at` integer NOT NULL,
	PRIMARY KEY(`child_id`, `theme_id`),
	FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON UPDATE no action ON DELETE cascade
);
