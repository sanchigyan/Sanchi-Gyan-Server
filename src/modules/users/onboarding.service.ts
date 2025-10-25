import { Role } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';

interface OnboardingData {
  purpose: string;
  userType: string;
  classLevel?: string;
}

export class OnboardingService {
  async updateOnboarding(userId: string, data: OnboardingData) {
    // Validate purpose
    const validPurposes = ['learn', 'find_opportunity'];
    if (!validPurposes.includes(data.purpose)) {
      throw new AppError('Invalid purpose', 400);
    }

    // Validate userType based on purpose
    const validUserTypes = ['student', 'learner', 'teacher', 'other_profession'];
    if (!validUserTypes.includes(data.userType)) {
      throw new AppError('Invalid user type', 400);
    }

    // Validate classLevel if student
    if (data.userType === 'student' && data.classLevel) {
      const validClasses = ['6', '7', '8', '9', '10'];
      if (!validClasses.includes(data.classLevel)) {
        throw new AppError('Invalid class level', 400);
      }
    }

     // Determine the role based on userType
    let role: Role  | null = null;

    switch (data.userType) {
      case 'student':
        // Don't set role yet - they need to subscribe first
        role = null;
        break;
      case 'learner':
        // Automatically set role to LEARNER
        role = Role.LEARNER;
        break;
      case 'teacher':
        role = null;
        break;
      case 'other_profession':
        // Keep as USER or null
        role = 'USER';
        break;
      default:
        role = null;
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        purpose: data.purpose,
        userType: data.userType,
        classLevel: data.classLevel || null,
        onboardingCompleted: true,
        role: role,
      },
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
        purpose: true,
        userType: true,
        classLevel: true,
        skill: true,
        onboardingCompleted: true,
      },
    });

    return user;
  }

  async getOnboardingStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        onboardingCompleted: true,
        purpose: true,
        userType: true,
        classLevel: true,
        skill: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
}