/*
  Warnings:

  - The values [ADMIN] on the enum `WorkspaceMemberRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WorkspaceMemberRole_new" AS ENUM ('OWNER', 'MANAGER', 'MEMBER', 'READ_ONLY');
ALTER TABLE "public"."workspace_members" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "workspace_members" ALTER COLUMN "role" TYPE "WorkspaceMemberRole_new" USING ("role"::text::"WorkspaceMemberRole_new");
ALTER TYPE "WorkspaceMemberRole" RENAME TO "WorkspaceMemberRole_old";
ALTER TYPE "WorkspaceMemberRole_new" RENAME TO "WorkspaceMemberRole";
DROP TYPE "public"."WorkspaceMemberRole_old";
ALTER TABLE "workspace_members" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
COMMIT;
