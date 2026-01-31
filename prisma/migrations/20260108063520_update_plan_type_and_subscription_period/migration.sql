/*
  Warnings:

  - The values [PRO,ENTERPRISE] on the enum `PlanType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PlanType_new" AS ENUM ('FREE', 'PAID');
ALTER TABLE "plans" ALTER COLUMN "plan_type" TYPE "PlanType_new" USING ("plan_type"::text::"PlanType_new");
ALTER TYPE "PlanType" RENAME TO "PlanType_old";
ALTER TYPE "PlanType_new" RENAME TO "PlanType";
DROP TYPE "public"."PlanType_old";
COMMIT;

-- AlterTable
ALTER TABLE "subscriptions" ALTER COLUMN "current_period_end" DROP NOT NULL;
