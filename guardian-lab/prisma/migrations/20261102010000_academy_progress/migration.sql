ALTER TABLE `User` MODIFY `streakDays` INTEGER NOT NULL DEFAULT 0, ADD COLUMN `lastLearningAt` DATETIME(3) NULL;
ALTER TABLE `QuizAttempt` ADD COLUMN `submissionId` VARCHAR(191) NULL, ADD COLUMN `result` JSON NULL;
CREATE UNIQUE INDEX `QuizAttempt_userId_submissionId_key` ON `QuizAttempt`(`userId`, `submissionId`);
UPDATE `User` u JOIN (SELECT userId, MAX(completedAt) AS learnedAt FROM QuizAttempt GROUP BY userId) a ON a.userId=u.id SET u.lastLearningAt=a.learnedAt;
