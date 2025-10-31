-- CreateEnum
CREATE TYPE "MeetingPlatform" AS ENUM ('ZOOM', 'GOOGLE_MEET', 'MICROSOFT_TEAMS', 'CUSTOM_WEBRTC', 'JITSI');

-- CreateEnum
CREATE TYPE "LiveClassStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('REGISTERED', 'JOINED', 'COMPLETED', 'MISSED');

-- CreateTable
CREATE TABLE "live_classes" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "meeting_link" TEXT,
    "meeting_platform" "MeetingPlatform" NOT NULL DEFAULT 'ZOOM',
    "recording_url" TEXT,
    "status" "LiveClassStatus" NOT NULL DEFAULT 'SCHEDULED',
    "max_attendees" INTEGER,
    "created_by_id" TEXT NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_pattern" TEXT,
    "notification_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_class_attendance" (
    "id" TEXT NOT NULL,
    "live_class_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3),
    "left_at" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'REGISTERED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_class_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_class_reminders" (
    "id" TEXT NOT NULL,
    "live_class_id" TEXT NOT NULL,
    "learner_id" TEXT NOT NULL,
    "reminder_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "type" TEXT NOT NULL DEFAULT 'email',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_class_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "live_classes_course_id_idx" ON "live_classes"("course_id");

-- CreateIndex
CREATE INDEX "live_classes_scheduled_at_idx" ON "live_classes"("scheduled_at");

-- CreateIndex
CREATE INDEX "live_classes_status_idx" ON "live_classes"("status");

-- CreateIndex
CREATE INDEX "live_classes_created_by_id_idx" ON "live_classes"("created_by_id");

-- CreateIndex
CREATE INDEX "live_class_attendance_live_class_id_idx" ON "live_class_attendance"("live_class_id");

-- CreateIndex
CREATE INDEX "live_class_attendance_user_id_idx" ON "live_class_attendance"("user_id");

-- CreateIndex
CREATE INDEX "live_class_attendance_status_idx" ON "live_class_attendance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "live_class_attendance_live_class_id_user_id_key" ON "live_class_attendance"("live_class_id", "user_id");

-- CreateIndex
CREATE INDEX "live_class_reminders_live_class_id_idx" ON "live_class_reminders"("live_class_id");

-- CreateIndex
CREATE INDEX "live_class_reminders_learner_id_idx" ON "live_class_reminders"("learner_id");

-- CreateIndex
CREATE INDEX "live_class_reminders_reminder_at_idx" ON "live_class_reminders"("reminder_at");

-- AddForeignKey
ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_class_attendance" ADD CONSTRAINT "live_class_attendance_live_class_id_fkey" FOREIGN KEY ("live_class_id") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_class_attendance" ADD CONSTRAINT "live_class_attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_class_reminders" ADD CONSTRAINT "live_class_reminders_live_class_id_fkey" FOREIGN KEY ("live_class_id") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_class_reminders" ADD CONSTRAINT "live_class_reminders_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
