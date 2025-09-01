-- DropForeignKey
ALTER TABLE "public"."notifications" DROP CONSTRAINT "notifications_taskId_fkey";

-- AlterTable
ALTER TABLE "public"."notifications" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
