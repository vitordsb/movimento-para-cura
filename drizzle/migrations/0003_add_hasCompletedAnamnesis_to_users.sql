ALTER TABLE `users`
ADD COLUMN `hasCompletedAnamnesis` boolean NOT NULL DEFAULT false AFTER `hasActivePlan`;
