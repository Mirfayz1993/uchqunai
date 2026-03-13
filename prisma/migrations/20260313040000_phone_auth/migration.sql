-- Drop old email column and add phone
ALTER TABLE "users" DROP COLUMN IF EXISTS "email";
ALTER TABLE "users" ADD COLUMN "phone" TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
ALTER TABLE "users" ALTER COLUMN "phone" DROP DEFAULT;
