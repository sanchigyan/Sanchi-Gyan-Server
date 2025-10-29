import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';

export class LearningService {
  // Get course structure with progress
  async getCourseStructure(userId: string, courseId: string) {
    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw new AppError('You are not enrolled in this course', 403);
    }

    // Get course with modules and lessons
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          where: { isPublished: true },
          include: {
            lessons: {
              where: { isPublished: true },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        teacher: {
          select: {
            fullname: true,
            profileImageUrl: true,
          },
        },
      },
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Get user's lesson progress
    const progress = await prisma.lessonProgress.findMany({
      where: {
        userId,
        lesson: {
          module: {
            courseId,
          },
        },
      },
    });

    // Create progress map
    const progressMap = new Map(
      progress.map((p) => [p.lessonId, p])
    );

    // Add progress to lessons
    const modulesWithProgress = course.modules.map((module) => ({
      ...module,
      lessons: module.lessons.map((lesson) => ({
        ...lesson,
        progress: progressMap.get(lesson.id) || null,
      })),
    }));

    return {
      course: {
        ...course,
        modules: modulesWithProgress,
      },
      enrollment,
    };
  }

  // Get single lesson with progress
  async getLesson(userId: string, lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.module.courseId,
        },
      },
    });

    if (!enrollment && !lesson.isFree) {
      throw new AppError('You are not enrolled in this course', 403);
    }

    // Get progress
    const progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    return {
      lesson,
      progress,
      enrollment,
    };
  }

  // Update lesson progress
  async updateProgress(userId: string, lessonId: string, data: {
    watchedSeconds?: number;
    isCompleted?: boolean;
  }) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: true,
      },
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    // Get enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new AppError('You are not enrolled in this course', 403);
    }

    // Update or create progress
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        watchedSeconds: data.watchedSeconds,
        isCompleted: data.isCompleted,
        completedAt: data.isCompleted ? new Date() : null,
        lastWatchedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        enrollmentId: enrollment.id,
        watchedSeconds: data.watchedSeconds || 0,
        isCompleted: data.isCompleted || false,
        completedAt: data.isCompleted ? new Date() : null,
      },
    });

    // Update enrollment last accessed and last lesson
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        lastAccessedAt: new Date(),
        lastLessonId: lessonId,
      },
    });

    // Recalculate course progress
    await this.updateCourseProgress(userId, lesson.module.courseId);

    return progress;
  }

  // Mark lesson as complete
  async markLessonComplete(userId: string, lessonId: string) {
    return this.updateProgress(userId, lessonId, {
      isCompleted: true,
    });
  }

  // Get next lesson
  async getNextLesson(userId: string, currentLessonId: string) {
    const currentLesson = await prisma.lesson.findUnique({
      where: { id: currentLessonId },
      include: {
        module: {
          include: {
            course: {
              include: {
                modules: {
                  where: { isPublished: true },
                  include: {
                    lessons: {
                      where: { isPublished: true },
                      orderBy: { orderIndex: 'asc' },
                    },
                  },
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!currentLesson) {
      throw new AppError('Lesson not found', 404);
    }

    // Find next lesson in current module
    const nextInModule = await prisma.lesson.findFirst({
      where: {
        moduleId: currentLesson.moduleId,
        orderIndex: { gt: currentLesson.orderIndex },
        isPublished: true,
      },
      orderBy: { orderIndex: 'asc' },
    });

    if (nextInModule) {
      return nextInModule;
    }

    // Find first lesson in next module
    const nextModule = await prisma.module.findFirst({
      where: {
        courseId: currentLesson.module.courseId,
        orderIndex: { gt: currentLesson.module.orderIndex },
        isPublished: true,
      },
      include: {
        lessons: {
          where: { isPublished: true },
          orderBy: { orderIndex: 'asc' },
          take: 1,
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    if (nextModule && nextModule.lessons.length > 0) {
      return nextModule.lessons[0];
    }

    return null; // No more lessons
  }

  // Update course progress percentage
  private async updateCourseProgress(userId: string, courseId: string) {
    const totalLessons = await prisma.lesson.count({
      where: {
        module: {
          courseId,
          isPublished: true,
        },
        isPublished: true,
      },
    });

    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId,
        isCompleted: true,
        lesson: {
          module: {
            courseId,
          },
        },
      },
    });

    const progressPercentage = totalLessons > 0
      ? (completedLessons / totalLessons) * 100
      : 0;

    await prisma.enrollment.update({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      data: {
        progressPercentage: Math.round(progressPercentage),
        completedAt: progressPercentage === 100 ? new Date() : null,
      },
    });
  }
}