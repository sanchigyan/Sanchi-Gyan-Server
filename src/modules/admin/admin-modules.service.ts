import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';

interface CreateModuleData {
  title: string;
  description?: string;
  orderIndex: number;
  isPublished?: boolean;
}

export class AdminModulesService {
  // Create module
  async createModule(adminId: string, courseId: string, data: CreateModuleData) {
    await this.verifyAdminAndCourse(adminId, courseId);

    const module = await prisma.module.create({
      data: {
        courseId,
        title: data.title,
        description: data.description,
        orderIndex: data.orderIndex,
        isPublished: data.isPublished ?? true,
      },
      include: {
        lessons: true,
      },
    });

    return module;
  }

  // Get all modules for a course
  async getModulesByCourse(adminId: string, courseId: string) {
    await this.verifyAdminAndCourse(adminId, courseId);

    const modules = await prisma.module.findMany({
      where: { courseId },
      include: {
        lessons: {
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { lessons: true },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    return modules;
  }

  // Get single module
  async getModuleById(adminId: string, moduleId: string) {
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            teacherId: true,
          },
        },
        lessons: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!module) {
      throw new AppError('Module not found', 404);
    }

    await this.verifyAdmin(adminId);

    return module;
  }

  // Update module
  async updateModule(adminId: string, moduleId: string, data: Partial<CreateModuleData>) {
    const module = await this.getModuleById(adminId, moduleId);

    const updated = await prisma.module.update({
      where: { id: moduleId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      },
      include: {
        lessons: true,
      },
    });

    return updated;
  }

  // Delete module
  async deleteModule(adminId: string, moduleId: string) {
    await this.getModuleById(adminId, moduleId);

    await prisma.module.delete({
      where: { id: moduleId },
    });

    return { message: 'Module deleted successfully' };
  }

  // Reorder modules
  async reorderModules(adminId: string, courseId: string, moduleOrders: { id: string; orderIndex: number }[]) {
    await this.verifyAdminAndCourse(adminId, courseId);

    await prisma.$transaction(
      moduleOrders.map((item) =>
        prisma.module.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        })
      )
    );

    return { message: 'Modules reordered successfully' };
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

  private async verifyAdminAndCourse(adminId: string, courseId: string) {
    await this.verifyAdmin(adminId);

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }
  }
}