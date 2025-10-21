-- AlterTable
ALTER TABLE "users" ADD COLUMN     "class_level" TEXT,
ADD COLUMN     "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "purpose" TEXT,
ADD COLUMN     "skill" TEXT,
ADD COLUMN     "user_type" TEXT;
