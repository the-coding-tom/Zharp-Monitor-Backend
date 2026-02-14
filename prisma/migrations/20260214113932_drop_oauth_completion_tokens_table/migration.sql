/*
  Warnings:

  - You are about to drop the `oauth_completion_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "oauth_completion_tokens" DROP CONSTRAINT "oauth_completion_tokens_user_id_fkey";

-- DropTable
DROP TABLE "oauth_completion_tokens";
