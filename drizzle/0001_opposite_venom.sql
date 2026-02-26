CREATE TABLE `interview_answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`questionId` int NOT NULL,
	`answer` text NOT NULL,
	`aiResponse` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interview_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interview_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentQuestionId` int NOT NULL DEFAULT 1,
	`completedSections` json NOT NULL DEFAULT ('[]'),
	`odysseyPaths` json NOT NULL DEFAULT ('{"path_a":"","path_b":"","path_c":""}'),
	`odysseyRatings` json NOT NULL DEFAULT ('{}'),
	`careerCanvas` json NOT NULL DEFAULT ('{}'),
	`nextSteps` json NOT NULL DEFAULT ('[]'),
	`isComplete` boolean NOT NULL DEFAULT false,
	`emailSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interview_sessions_id` PRIMARY KEY(`id`)
);
