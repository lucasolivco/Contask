/*
  Warnings:

  - Added the required column `userId` to the `attachments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."attachments" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
