-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "instructor_name" TEXT,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'English',
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "total_lessons" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "video_preview_url" TEXT;
