/*
  Warnings:

  - You are about to drop the `live_class_attendance` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."live_class_attendance" DROP CONSTRAINT "live_class_attendance_live_class_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."live_class_attendance" DROP CONSTRAINT "live_class_attendance_user_id_fkey";

-- DropTable
DROP TABLE "public"."live_class_attendance";

-- CreateTable
CREATE TABLE "live_class_attendances" (
    "id" TEXT NOT NULL,
    "live_class_id" TEXT NOT NULL,
    "learner_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "duration_mins" INTEGER,
    "is_present" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "live_class_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "live_class_attendances_live_class_id_idx" ON "live_class_attendances"("live_class_id");

-- CreateIndex
CREATE INDEX "live_class_attendances_learner_id_idx" ON "live_class_attendances"("learner_id");

-- CreateIndex
CREATE UNIQUE INDEX "live_class_attendances_live_class_id_learner_id_key" ON "live_class_attendances"("live_class_id", "learner_id");

-- AddForeignKey
ALTER TABLE "live_class_attendances" ADD CONSTRAINT "live_class_attendances_live_class_id_fkey" FOREIGN KEY ("live_class_id") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_class_attendances" ADD CONSTRAINT "live_class_attendances_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
