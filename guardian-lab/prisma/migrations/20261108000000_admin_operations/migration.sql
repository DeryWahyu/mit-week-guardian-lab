ALTER TABLE `User` ADD COLUMN `suspendedAt` DATETIME(3) NULL, ADD COLUMN `suspensionReason` TEXT NULL;
ALTER TABLE `CommunityReplay` ADD COLUMN `withdrawnAt` DATETIME(3) NULL, ADD COLUMN `withdrawalReason` TEXT NULL;
CREATE TABLE `AdminAuditLog` (
 `id` VARCHAR(191) NOT NULL, `actorId` VARCHAR(191) NULL,
 `action` VARCHAR(64) NOT NULL, `entityType` VARCHAR(32) NOT NULL,
 `entityId` VARCHAR(191) NOT NULL, `reason` TEXT NULL, `details` JSON NOT NULL,
 `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY (`id`), INDEX `AdminAuditLog_createdAt_id_idx` (`createdAt`,`id`),
 INDEX `AdminAuditLog_actorId_createdAt_idx` (`actorId`,`createdAt`),
 INDEX `AdminAuditLog_action_createdAt_idx` (`action`,`createdAt`),
 CONSTRAINT `AdminAuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `AdminInvestigationReview` (
 `id` VARCHAR(191) NOT NULL, `investigationId` VARCHAR(191) NOT NULL,
 `reviewerId` VARCHAR(191) NOT NULL, `status` VARCHAR(32) NOT NULL,
 `note` TEXT NOT NULL, `updatedAt` DATETIME(3) NOT NULL,
 PRIMARY KEY (`id`), UNIQUE INDEX `AdminInvestigationReview_investigationId_key` (`investigationId`),
 CONSTRAINT `AdminInvestigationReview_investigationId_fkey` FOREIGN KEY (`investigationId`) REFERENCES `ForensicRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT `AdminInvestigationReview_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
