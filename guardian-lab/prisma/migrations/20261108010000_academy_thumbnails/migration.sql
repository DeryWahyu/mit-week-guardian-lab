CREATE TABLE `QuizThumbnail` (
    `quizId` VARCHAR(191) NOT NULL,
    `data` MEDIUMBLOB NOT NULL,
    `version` CHAR(64) NOT NULL,
    PRIMARY KEY (`quizId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `QuizThumbnail` ADD CONSTRAINT `QuizThumbnail_quizId_fkey`
    FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
