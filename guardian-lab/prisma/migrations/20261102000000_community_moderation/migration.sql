-- AlterTable
ALTER TABLE `CommunityReplay` ADD COLUMN `consentedAt` DATETIME(3) NULL,
    ADD COLUMN `reviewerId` VARCHAR(191) NULL,
    ADD COLUMN `sourceRecordId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `CommunityReplay_sourceRecordId_key` ON `CommunityReplay`(`sourceRecordId`);

-- AddForeignKey
ALTER TABLE `CommunityReplay` ADD CONSTRAINT `CommunityReplay_sourceRecordId_fkey` FOREIGN KEY (`sourceRecordId`) REFERENCES `ForensicRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommunityReplay` ADD CONSTRAINT `CommunityReplay_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
