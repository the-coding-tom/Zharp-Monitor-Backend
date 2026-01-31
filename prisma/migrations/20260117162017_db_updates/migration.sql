/*
  Warnings:

  - You are about to drop the `notification_deliveries` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "notification_deliveries" DROP CONSTRAINT "notification_deliveries_notification_id_fkey";

-- DropForeignKey
ALTER TABLE "notification_deliveries" DROP CONSTRAINT "notification_deliveries_user_id_fkey";

-- DropTable
DROP TABLE "notification_deliveries";

-- DropEnum
DROP TYPE "DeliveryStatus";

-- DropEnum
DROP TYPE "NotificationChannel";
