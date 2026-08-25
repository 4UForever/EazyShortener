-- CreateEnum
CREATE TYPE "LinkCreatedVia" AS ENUM ('GUEST_WEB', 'USER_WEB', 'API');

-- CreateTable
CREATE TABLE "links" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "short_code" TEXT NOT NULL,
    "original_url" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_via" "LinkCreatedVia" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "links_short_code_key" ON "links"("short_code");

-- CreateIndex
CREATE INDEX "links_user_id_idx" ON "links"("user_id");

-- CreateIndex
CREATE INDEX "links_expires_at_idx" ON "links"("expires_at");
