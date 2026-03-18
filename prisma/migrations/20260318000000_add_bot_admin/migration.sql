-- CreateTable
CREATE TABLE "bot_admins" (
    "id" TEXT NOT NULL,
    "bot_slug" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "bot_admins_bot_slug_key" ON "bot_admins"("bot_slug");

-- CreateIndex
CREATE UNIQUE INDEX "bot_admins_username_key" ON "bot_admins"("username");
