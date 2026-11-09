ALTER TABLE `SandboxSession` ADD COLUMN `sourceInvestigationId` VARCHAR(191) NULL;
CREATE INDEX `SandboxSession_sourceInvestigationId_idx` ON `SandboxSession`(`sourceInvestigationId`);
ALTER TABLE `SandboxSession` ADD CONSTRAINT `SandboxSession_sourceInvestigationId_fkey` FOREIGN KEY (`sourceInvestigationId`) REFERENCES `ForensicRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TABLE `SandboxDownloadAnalysis` (
  `sessionId` VARCHAR(191) NOT NULL,
  `downloadId` VARCHAR(191) NOT NULL,
  `recordId` VARCHAR(191) NULL,
  UNIQUE INDEX `SandboxDownloadAnalysis_recordId_key` (`recordId`),
  PRIMARY KEY (`sessionId`, `downloadId`),
  CONSTRAINT `SandboxDownloadAnalysis_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `SandboxSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `SandboxDownloadAnalysis_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `ForensicRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `ReplayAttempt` ADD COLUMN `submissionId` VARCHAR(191) NULL, ADD COLUMN `result` JSON NULL;
CREATE UNIQUE INDEX `ReplayAttempt_userId_submissionId_key` ON `ReplayAttempt`(`userId`, `submissionId`);
