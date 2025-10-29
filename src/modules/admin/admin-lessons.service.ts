import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { LessonType } from '@prisma/client';

interface CreateLessonData {
  title: string;
  description?: string;
  type: LessonType;
  contentUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  orderIndex: number;
  isFree?: boolean;
  isPublished?: boolean;
  resources?: any;
}

export class AdminLessonsService {
  // Create lesson
  async createLesson(adminId: string, moduleId: string, data: CreateLessonData) {
    const module = await this.verifyAdminAndModule(adminId, moduleId);

    const lesson = await prisma.lesson.create({
      data: {
        moduleId,
        title: data.title,
        description: data.description,
        type: data.type,
        contentUrl: data.contentUrl,
        thumbnailUrl: data.thumbnailUrl,
        durationSeconds: data.durationSeconds,
        orderIndex: data.orderIndex,
        isFree: data.isFree ?? false,
        isPublished: data.isPublished ?? true,
        resources: data.resources,
      },
    });

    // Update course total lessons count
    await this.updateCourseLessonCount(module.courseId);

    return lesson;
  }

  // Get all lessons for a module
  async getLessonsByModule(adminId: string, moduleId: string) {
    await this.verifyAdminAndModule(adminId, moduleId);

    const lessons = await prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { orderIndex: 'asc' },
    });

    return lessons;
  }

  // Get single lesson
  async getLessonById(adminId: string, lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                teacherId: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    await this.verifyAdmin(adminId);

    return lesson;
  }

  // Update lesson
  async updateLesson(adminId: string, lessonId: string, data: Partial<CreateLessonData>) {
    await this.getLessonById(adminId, lessonId);

    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type && { type: data.type }),
        ...(data.contentUrl !== undefined && { contentUrl: data.contentUrl }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
        ...(data.durationSeconds !== undefined && { durationSeconds: data.durationSeconds }),
        ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
        ...(data.isFree !== undefined && { isFree: data.isFree }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
        ...(data.resources !== undefined && { resources: data.resources }),
      },
    });

    return updated;
  }

  // Delete lesson
  async deleteLesson(adminId: string, lessonId: string) {
    const lesson = await this.getLessonById(adminId, lessonId);

    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    // Update course total lessons count
    await this.updateCourseLessonCount(lesson.module.courseId);

    return { message: 'Lesson deleted successfully' };
  }

  // Reorder lessons
  async reorderLessons(adminId: string, moduleId: string, lessonOrders: { id: string; orderIndex: number }[]) {
    await this.verifyAdminAndModule(adminId, moduleId);

    await prisma.$transaction(
      lessonOrders.map((item) =>
        prisma.lesson.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        })
      )
    );

    return { message: 'Lessons reordered successfully' };
  }

  // Helper methods
  private async verifyAdmin(adminId: string) {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new AppError('Unauthorized. Admin access required.', 403);
    }
  }

  private async verifyAdminAndModule(adminId: string, moduleId: string) {
    await this.verifyAdmin(adminId);

    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new AppError('Module not found', 404);
    }

    return module;
  }

  private async updateCourseLessonCount(courseId: string) {
    const count = await prisma.lesson.count({
      where: {
        module: {
          courseId,
        },
        isPublished: true,
      },
    });

    await prisma.course.update({
      where: { id: courseId },
      data: { totalLessons: count },
    });
  }
}