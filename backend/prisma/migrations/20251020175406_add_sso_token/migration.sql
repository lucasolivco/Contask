/*
  Warnings:

  - A unique constraint covering the columns `[ssoToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "ssoToken" TEXT,
ADD COLUMN     "ssoTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_ssoToken_key" ON "public"."users"("ssoToken");
