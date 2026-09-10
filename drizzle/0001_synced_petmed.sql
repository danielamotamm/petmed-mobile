CREATE TABLE `pets` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `name` varchar(120) NOT NULL,
  `species` varchar(80) NOT NULL,
  `weight` varchar(40) NOT NULL,
  `avatar` varchar(4) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `pets_id` PRIMARY KEY(`id`),
  CONSTRAINT `pets_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
CREATE INDEX `pets_userId_idx` ON `pets` (`userId`);

CREATE TABLE `medicationTreatments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `petId` int NOT NULL,
  `name` varchar(160) NOT NULL,
  `dose` varchar(80) NOT NULL,
  `unit` varchar(32) NOT NULL,
  `instructions` text,
  `startDate` varchar(10) NOT NULL,
  `endDate` varchar(10) NOT NULL,
  `timezone` varchar(80) NOT NULL,
  `status` enum('active','stopped','completed') NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `medicationTreatments_id` PRIMARY KEY(`id`),
  CONSTRAINT `medicationTreatments_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `medicationTreatments_petId_fk` FOREIGN KEY (`petId`) REFERENCES `pets`(`id`) ON DELETE CASCADE
);
CREATE INDEX `treatments_userId_petId_idx` ON `medicationTreatments` (`userId`,`petId`);

CREATE TABLE `treatmentSchedules` (
  `id` int AUTO_INCREMENT NOT NULL,
  `treatmentId` int NOT NULL,
  `time` varchar(5) NOT NULL,
  CONSTRAINT `treatmentSchedules_id` PRIMARY KEY(`id`),
  CONSTRAINT `treatmentSchedules_treatmentId_fk` FOREIGN KEY (`treatmentId`) REFERENCES `medicationTreatments`(`id`) ON DELETE CASCADE,
  CONSTRAINT `treatmentSchedules_treatmentId_time_unique` UNIQUE(`treatmentId`,`time`)
);

CREATE TABLE `doseOccurrences` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `petId` int NOT NULL,
  `treatmentId` int NOT NULL,
  `scheduledAt` timestamp NOT NULL,
  `status` enum('pending','administered','missed') NOT NULL DEFAULT 'pending',
  `administeredAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `doseOccurrences_id` PRIMARY KEY(`id`),
  CONSTRAINT `doseOccurrences_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `doseOccurrences_petId_fk` FOREIGN KEY (`petId`) REFERENCES `pets`(`id`) ON DELETE CASCADE,
  CONSTRAINT `doseOccurrences_treatmentId_fk` FOREIGN KEY (`treatmentId`) REFERENCES `medicationTreatments`(`id`) ON DELETE CASCADE,
  CONSTRAINT `doseOccurrences_treatmentId_scheduledAt_unique` UNIQUE(`treatmentId`,`scheduledAt`)
);
CREATE INDEX `doseOccurrences_userId_scheduledAt_idx` ON `doseOccurrences` (`userId`,`scheduledAt`);
CREATE INDEX `doseOccurrences_petId_scheduledAt_idx` ON `doseOccurrences` (`petId`,`scheduledAt`);
