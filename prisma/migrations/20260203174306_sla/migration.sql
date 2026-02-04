-- AlterTable
ALTER TABLE `users` ADD COLUMN `address` VARCHAR(255) NULL,
    ADD COLUMN `addressNumber` VARCHAR(20) NULL,
    ADD COLUMN `cpfCnpj` VARCHAR(20) NULL,
    ADD COLUMN `mobilePhone` VARCHAR(20) NULL,
    ADD COLUMN `postalCode` VARCHAR(20) NULL,
    ADD COLUMN `province` VARCHAR(100) NULL;
