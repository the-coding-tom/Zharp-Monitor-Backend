-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "invalid_token_reported_at" TIMESTAMP(3),
ADD COLUMN     "is_invalid_token" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_delivery_attempt_at" TIMESTAMP(3),
ADD COLUMN     "last_delivery_error" TEXT,
ADD COLUMN     "last_delivery_status" TEXT;

-- AlterTable
ALTER TABLE "notification_deliveries" ADD COLUMN     "bounce_reason" TEXT,
ADD COLUMN     "bounce_type" TEXT,
ADD COLUMN     "bounced_at" TIMESTAMP(3),
ADD COLUMN     "clicked_at" TIMESTAMP(3),
ADD COLUMN     "complaint_at" TIMESTAMP(3),
ADD COLUMN     "delivered_at" TIMESTAMP(3),
ADD COLUMN     "is_complaint" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "opened_at" TIMESTAMP(3),
ADD COLUMN     "unsubscribed_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "devices_is_invalid_token_idx" ON "devices"("is_invalid_token");

-- CreateIndex
CREATE INDEX "notification_deliveries_external_id_idx" ON "notification_deliveries"("external_id");
