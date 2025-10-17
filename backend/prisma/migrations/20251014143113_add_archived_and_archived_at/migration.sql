-- AlterEnum
ALTER TYPE "public"."NotificationType" ADD VALUE 'TASK_ARCHIVED';

-- AlterEnum
ALTER TYPE "public"."TaskStatus" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "public"."tasks" ADD COLUMN     "archivedAt" TIMESTAMP(3);
