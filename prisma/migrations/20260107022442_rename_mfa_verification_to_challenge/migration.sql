/*
  Warnings:

  - You are about to drop the `mfa_verification_sessions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MfaChallengeSessionStatus" AS ENUM ('pending', 'verified', 'expired', 'failed');

-- DropForeignKey
ALTER TABLE "mfa_verification_sessions" DROP CONSTRAINT "mfa_verification_sessions_user_id_fkey";

-- DropTable
DROP TABLE "mfa_verification_sessions";

-- DropEnum
DROP TYPE "MfaVerificationSessionStatus";

-- CreateTable
CREATE TABLE "mfa_challenge_sessions" (
    "id" SERIAL NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "mfa_method" "MfaMethod" NOT NULL,
    "status" "MfaChallengeSessionStatus" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfa_challenge_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mfa_challenge_sessions_session_token_key" ON "mfa_challenge_sessions"("session_token");

-- AddForeignKey
ALTER TABLE "mfa_challenge_sessions" ADD CONSTRAINT "mfa_challenge_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
