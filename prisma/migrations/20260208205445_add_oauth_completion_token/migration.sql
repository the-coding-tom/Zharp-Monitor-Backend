-- CreateTable
CREATE TABLE "oauth_completion_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_completion_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oauth_completion_tokens_token_key" ON "oauth_completion_tokens"("token");

-- CreateIndex
CREATE INDEX "oauth_completion_tokens_token_idx" ON "oauth_completion_tokens"("token");

-- CreateIndex
CREATE INDEX "oauth_completion_tokens_expires_at_idx" ON "oauth_completion_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "oauth_completion_tokens" ADD CONSTRAINT "oauth_completion_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
