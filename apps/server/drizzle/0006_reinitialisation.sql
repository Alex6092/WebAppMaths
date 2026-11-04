CREATE TABLE `password_reset` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code_hash` text NOT NULL,
	`user_id` integer,
	`family_id` integer,
	`child_id` integer,
	`school_id` integer,
	`created_by` integer,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `parent_user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`family_id`) REFERENCES `family`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `parent_user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_code_hash_unique` ON `password_reset` (`code_hash`);