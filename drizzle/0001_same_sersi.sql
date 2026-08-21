CREATE TABLE `scenarioReports` (
	`id` varchar(32) NOT NULL,
	`scenarioId` varchar(32) NOT NULL,
	`ownerId` int NOT NULL,
	`shareId` varchar(32) NOT NULL,
	`title` varchar(160) NOT NULL,
	`reportJson` text NOT NULL,
	`plainEnglishExplanation` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scenarioReports_id` PRIMARY KEY(`id`),
	CONSTRAINT `scenario_reports_share_id_idx` UNIQUE(`shareId`)
);
--> statement-breakpoint
CREATE TABLE `scenarios` (
	`id` varchar(32) NOT NULL,
	`ownerId` int NOT NULL,
	`title` varchar(160) NOT NULL,
	`graphSource` enum('synthetic','openstreetmap') NOT NULL,
	`cityName` varchar(160),
	`configurationJson` text NOT NULL,
	`comparisonJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scenarios_id` PRIMARY KEY(`id`)
);
