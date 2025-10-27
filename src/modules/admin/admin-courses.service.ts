import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { Level } from '@prisma/client';

interface CreateCourseData {
  title: string;
  instructorName: string;
  rating: number;
  category: string;
  thumbnailUrl: string;
  durationHours: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  price: number;
  discountPrice?: number;
  totalLessons: number;
  language: string;
  videoPreviewUrl?: string;
  skills: string[];
  description: string;
}

export class AdminCoursesService {
  // Create course
  async createCourse(adminId: string, data: CreateCourseData) {
    // Validate admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new AppError('Unauthorized. Admin access required.', 403);
    }

    // Generate slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingCourse = await prisma.course.findUnique({
      where: { slug },
    });

    if (existingCourse) {
      throw new AppError('A course with this title already exists', 400);
    }

    // Create course
    const course = await prisma.course.create({
      data: {
        title: data.title,
        slug,
        instructorName: data.instructorName,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl,
        teacherId: adminId,
        category: data.category,
        level: data.level as Level,
        durationHours: data.durationHours,
        price: data.price,
        discountPrice: data.discountPrice,
        rating: data.rating,
        language: data.language,
        videoPreviewUrl: data.videoPreviewUrl,
        skills: data.skills,
        totalLessons: data.totalLessons,
        isPublished: false, // Draft by default
        enrollmentCount: 0,
      },
      include: {
        teacher: {
          select: {
            fullname: true,
            email: true,
          },
        },
      },
    });

    return course;
  }

  // Update course
  async updateCourse(adminId: string, courseId: string, data: Partial<CreateCourseData>) {
    // Validate admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new AppError('Unauthorized. Admin access required.', 403);
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      throw new AppError('Course not found', 404);
    }

    // Update slug if title changes
    let slug = existingCourse.slug;
    if (data.title && data.title !== existingCourse.title) {
      slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Update course
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...(data.title && { title: data.title, slug }),
        ...(data.instructorName && { instructorName: data.instructorName }),
        ...(data.description && { description: data.description }),
        ...(data.thumbnailUrl && { thumbnailUrl: data.thumbnailUrl }),
        ...(data.category && { category: data.category }),
        ...(data.level && { level: data.level as Level }),
        ...(data.durationHours !== undefined && { durationHours: data.durationHours }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.discountPrice !== undefined && { discountPrice: data.discountPrice }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.language && { language: data.language }),
        ...(data.videoPreviewUrl && { videoPreviewUrl: data.videoPreviewUrl }),
        ...(data.skills && { skills: data.skills }),
        ...(data.totalLessons !== undefined && { totalLessons: data.totalLessons }),
      },
    });

    return updatedCourse;
  }

  // Publish/Unpublish course
  async togglePublishCourse(adminId: string, courseId: string) {
    // Validate admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new AppError('Unauthorized. Admin access required.', 403);
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        isPublished: !course.isPublished,
      },
    });

    return updatedCourse;
  }

  // Delete course
  async deleteCourse(adminId: string, courseId: string) {
    // Validate admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new AppError('Unauthorized. Admin access required.', 403);
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    await prisma.course.delete({
      where: { id: courseId },
    });

    return { message: 'Course deleted successfully' };
  }

  // Get all courses (for admin)
  async getAllCoursesForAdmin(adminId: string) {
    // Validate admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new AppError('Unauthorized. Admin access required.', 403);
    }

    const courses = await prisma.course.findMany({
      include: {
        teacher: {
          select: {
            fullname: true,
            email: true,
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

  // Get single course (for admin)
  async getCourseForAdmin(adminId: string, courseId: string) {
    // Validate admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new AppError('Unauthorized. Admin access required.', 403);
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        teacher: {
          select: {
            fullname: true,
            email: true,
          },
        },
        sections: {
          include: {
            videos: true,
          },
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
}