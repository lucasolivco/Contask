/*
  Warnings:

  - You are about to drop the column `filename` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `path` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `attachments` table. All the data in the column will be lost.
  - Added the required column `fileName` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filePath` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileSize` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadedById` to the `attachments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."attachments" DROP CONSTRAINT "attachments_userId_fkey";

-- AlterTable
ALTER TABLE "public"."attachments" DROP COLUMN "filename",
DROP COLUMN "path",
DROP COLUMN "size",
DROP COLUMN "userId",
ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "filePath" TEXT NOT NULL,
ADD COLUMN     "fileSize" INTEGER NOT NULL,
ADD COLUMN     "uploadedById" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."comments" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
