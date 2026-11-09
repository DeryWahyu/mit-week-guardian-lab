ALTER TABLE `User` ADD COLUMN `phone` VARCHAR(16) NULL, ADD COLUMN `phoneVerifiedAt` DATETIME(3) NULL;
CREATE UNIQUE INDEX `User_phone_key` ON `User`(`phone`);
CREATE TABLE `AuthChallenge` (
  `id` VARCHAR(191) NOT NULL, `tokenHash` CHAR(64) NOT NULL, `userId` VARCHAR(191) NULL,
  `purpose` VARCHAR(16) NOT NULL, `phoneHash` CHAR(64) NOT NULL, `codeHash` CHAR(64) NULL, `codeExpiresAt` DATETIME(3) NULL, `deliveryStatus` VARCHAR(16) NULL,
  `redirectTo` TEXT NOT NULL, `attempts` INTEGER NOT NULL DEFAULT 0, `lastSentAt` DATETIME(3) NULL,
  `expiresAt` DATETIME(3) NOT NULL, `consumedAt` DATETIME(3) NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `AuthChallenge_tokenHash_key`(`tokenHash`), INDEX `AuthChallenge_userId_purpose_idx`(`userId`, `purpose`),
  INDEX `AuthChallenge_expiresAt_idx`(`expiresAt`), PRIMARY KEY (`id`),
  CONSTRAINT `AuthChallenge_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `AuthRateLimit` (
  `key` VARCHAR(128) NOT NULL, `count` INTEGER NOT NULL DEFAULT 0, `expiresAt` DATETIME(3) NOT NULL,
  INDEX `AuthRateLimit_expiresAt_idx`(`expiresAt`), PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
