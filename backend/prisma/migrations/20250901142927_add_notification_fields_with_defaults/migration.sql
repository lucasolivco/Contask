-- prisma/migrations/[timestamp]_add_notification_fields_with_defaults/migration.sql

-- ✅ 1. ADICIONAR NOVOS TIPOS DE NOTIFICAÇÃO AO ENUM
ALTER TYPE "NotificationType" ADD VALUE 'TASK_CANCELLED';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_REASSIGNED';

-- ✅ 2. ADICIONAR COLUNA metadata (OPCIONAL - sem problemas)
ALTER TABLE "notifications" ADD COLUMN "metadata" TEXT;

-- ✅ 3. ADICIONAR COLUNA updatedAt COM VALOR PADRÃO
ALTER TABLE "notifications" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ✅ 4. ATUALIZAR REGISTROS EXISTENTES para ter updatedAt = createdAt
UPDATE "notifications" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

-- ✅ 5. ALTERAR message para TEXT (maior capacidade)
ALTER TABLE "notifications" ALTER COLUMN "message" TYPE TEXT;