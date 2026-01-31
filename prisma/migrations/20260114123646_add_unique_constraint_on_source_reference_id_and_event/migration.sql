/*
  Warnings:

  - You are about to drop the column `message_id` on the `webhook_event_logs` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[source,reference_id,event]` on the table `webhook_event_logs` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "webhook_event_logs_source_message_id_event_key";

-- AlterTable
ALTER TABLE "webhook_event_logs" DROP COLUMN "message_id",
ADD COLUMN     "external_event_id" TEXT,
ADD COLUMN     "reference_id" VARCHAR(255);

-- CreateIndex
CREATE INDEX "webhook_event_logs_external_event_id_idx" ON "webhook_event_logs"("external_event_id");

-- CreateIndex
CREATE INDEX "webhook_event_logs_reference_id_idx" ON "webhook_event_logs"("reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_event_logs_source_reference_id_event_key" ON "webhook_event_logs"("source", "reference_id", "event");
