/*
  Warnings:

  - Added the required column `amount` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentcy` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripePayMentId` to the `order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `order` ADD COLUMN `amount` INTEGER NOT NULL,
    ADD COLUMN `currentcy` VARCHAR(191) NOT NULL,
    ADD COLUMN `stripePayMentId` VARCHAR(191) NOT NULL;
