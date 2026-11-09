-- Preserve existing reports without presenting them as verified model output.
ALTER TABLE `ForensicRecord`
    ADD COLUMN `analysisSource` VARCHAR(191) NULL,
    ADD COLUMN `errorCode` VARCHAR(191) NULL,
    ADD COLUMN `errorMessage` TEXT NULL,
    ADD COLUMN `finishedAt` DATETIME(3) NULL,
    ADD COLUMN `inputMetadata` JSON NULL,
    ADD COLUMN `modelVersion` VARCHAR(191) NULL,
    ADD COLUMN `startedAt` DATETIME(3) NULL,
    ADD COLUMN `status` ENUM('RECEIVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'UNAVAILABLE') NOT NULL DEFAULT 'RECEIVED',
    ADD COLUMN `updatedAt` DATETIME(3) NULL,
    MODIFY `riskLevel` ENUM('SAFE', 'WARNING', 'DANGEROUS', 'PHISHING', 'MALWARE', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW') NULL,
    MODIFY `riskScore` INTEGER NULL,
    MODIFY `scamCategory` VARCHAR(191) NULL,
    MODIFY `summary` TEXT NULL;

UPDATE `ForensicRecord`
SET `status` = 'COMPLETED', `analysisSource` = 'LEGACY_UNVERIFIED',
    `inputMetadata` = JSON_OBJECT(), `updatedAt` = `createdAt`, `finishedAt` = `createdAt`;

ALTER TABLE `ForensicRecord`
    MODIFY `inputMetadata` JSON NOT NULL,
    MODIFY `updatedAt` DATETIME(3) NOT NULL;

CREATE INDEX `ForensicRecord_userId_status_createdAt_idx` ON `ForensicRecord`(`userId`, `status`, `createdAt`);
