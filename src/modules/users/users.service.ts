import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { hashPassword, comparePassword } from '../../utils/password.util';

export class UserService {
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
        profileImageUrl: true,
        isEmailVerified: true,
        onboardingCompleted: true,
        purpose: true,
        userType: true,
        classLevel: true,
        skill: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async updateProfile(userId: string, data: {
    fullname?: string;
    profileImageUrl?: string;
  }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullname: data.fullname,
        profileImageUrl: data.profileImageUrl,
      },
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
        profileImageUrl: true,
      },
    });

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, user.passwordHash);

    if (!isValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Hash and update password
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully' };
  }

  async getAllUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fullname: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          onboardingCompleted: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUserRole(userId: string, role: string) {
    // Validate role
    const validRoles = ['ADMIN', 'TEACHER', 'STUDENT'];
    if (!validRoles.includes(role)) {
      throw new AppError('Invalid role', 400);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
      },
    });

    return user;
  }

  async deleteUser(userId: string) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  }
}