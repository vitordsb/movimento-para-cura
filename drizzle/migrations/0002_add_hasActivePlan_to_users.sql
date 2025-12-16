ALTER TABLE `users`
ADD COLUMN `hasActivePlan` boolean NOT NULL DEFAULT false AFTER `loginMethod`;
