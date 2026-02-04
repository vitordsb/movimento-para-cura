-- CreateTable
CREATE TABLE `daily_hydrations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `currentIntakeMl` INTEGER NOT NULL DEFAULT 0,
    `dailyGoalMl` INTEGER NOT NULL DEFAULT 2000,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `daily_hydrations_userId_idx`(`userId`),
    UNIQUE INDEX `daily_hydrations_userId_date_key`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `symptom_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `symptom` VARCHAR(100) NOT NULL,
    `intensity` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `symptom_logs_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `daily_hydrations` ADD CONSTRAINT `daily_hydrations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `symptom_logs` ADD CONSTRAINT `symptom_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
