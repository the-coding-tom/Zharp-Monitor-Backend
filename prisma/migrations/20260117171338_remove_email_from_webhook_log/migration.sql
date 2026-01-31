/*
  Warnings:

  - You are about to drop the column `email` on the `webhook_event_logs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "webhook_event_logs_email_idx";

-- AlterTable
ALTER TABLE "webhook_event_logs" DROP COLUMN "email";
