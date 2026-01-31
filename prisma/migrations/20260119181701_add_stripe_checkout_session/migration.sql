-- CreateEnum
CREATE TYPE "CheckoutSessionStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED', 'FAILED');

-- CreateTable
CREATE TABLE "stripe_checkout_sessions" (
    "id" SERIAL NOT NULL,
    "stripe_session_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "billing_interval" "BillingInterval" NOT NULL,
    "status" "CheckoutSessionStatus" NOT NULL DEFAULT 'PENDING',
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "error_message" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stripe_checkout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stripe_checkout_sessions_stripe_session_id_key" ON "stripe_checkout_sessions"("stripe_session_id");

-- CreateIndex
CREATE INDEX "stripe_checkout_sessions_user_id_idx" ON "stripe_checkout_sessions"("user_id");

-- CreateIndex
CREATE INDEX "stripe_checkout_sessions_status_idx" ON "stripe_checkout_sessions"("status");

-- CreateIndex
CREATE INDEX "stripe_checkout_sessions_status_created_at_idx" ON "stripe_checkout_sessions"("status", "created_at");

-- AddForeignKey
ALTER TABLE "stripe_checkout_sessions" ADD CONSTRAINT "stripe_checkout_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stripe_checkout_sessions" ADD CONSTRAINT "stripe_checkout_sessions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
