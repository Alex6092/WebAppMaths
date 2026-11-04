CREATE TABLE `rollover_choice` (
	`child_id` integer PRIMARY KEY NOT NULL,
	`to_class_id` integer,
	`grade` text,
	`leaves` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_class_id`) REFERENCES `classroom`(`id`) ON UPDATE no action ON DELETE cascade
);
