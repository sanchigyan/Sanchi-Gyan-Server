import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';

export class CoursesService {
  // Get all published courses
  async getAllCourses(filters?: {
    category?: string;
    level?: string;
    search?: string;
  }) {
    const where: any = {
      isPublished: true,
    };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.level) {
      where.level = filters.level;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            fullname: true,
            profileImageUrl: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return courses;
  }

  // Get single course by ID
  async getCourseById(courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        teacher: {
          select: {
            id: true,
            fullname: true,
            profileImageUrl: true,
            email: true,
          },
        },
        sections: {
          include: {
            videos: {
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        reviews: {
          include: {
            user: {
              select: {
                fullname: true,
                profileImageUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    return course;
  }

  // Check if user is enrolled
  async isUserEnrolled(userId: string, courseId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    return !!enrollment;
  }

  // Get user's enrolled courses
  async getUserEnrolledCourses(userId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            teacher: {
              select: {
                fullname: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastAccessedAt: 'desc',
      },
    });

    return enrollments;
  }
}