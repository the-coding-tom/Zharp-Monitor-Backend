-- CreateTable
CREATE TABLE "webhook_event_logs" (
    "id" SERIAL NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "event" VARCHAR(100) NOT NULL,
    "message_id" VARCHAR(255),
    "email" VARCHAR(255),
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_event_logs_source_idx" ON "webhook_event_logs"("source");

-- CreateIndex
CREATE INDEX "webhook_event_logs_event_idx" ON "webhook_event_logs"("event");

-- CreateIndex
CREATE INDEX "webhook_event_logs_email_idx" ON "webhook_event_logs"("email");

-- CreateIndex
CREATE INDEX "webhook_event_logs_created_at_idx" ON "webhook_event_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_event_logs_source_message_id_event_key" ON "webhook_event_logs"("source", "message_id", "event");
