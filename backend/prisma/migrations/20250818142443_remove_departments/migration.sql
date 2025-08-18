/*
  Warnings:

  - You are about to drop the column `userId` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `verificationToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `departments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."attachments" DROP CONSTRAINT "attachments_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tasks" DROP CONSTRAINT "tasks_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_departmentId_fkey";

-- AlterTable
ALTER TABLE "public"."attachments" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "public"."tasks" DROP COLUMN "departmentId";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "departmentId",
DROP COLUMN "isVerified",
DROP COLUMN "verificationToken";

-- DropTable
DROP TABLE "public"."departments";
