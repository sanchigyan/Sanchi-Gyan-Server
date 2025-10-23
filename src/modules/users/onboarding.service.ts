import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';

interface OnboardingData {
  purpose: string;
  userType: string;
  classLevel?: string;
  skill?: string;
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

    // Validate skill if learner
    if (data.userType === 'learner' && data.skill) {
      const validSkills = ['digital_marketing', 'video_editing'];
      if (!validSkills.includes(data.skill)) {
        throw new AppError('Invalid skill', 400);
      }
    }

    // Determine role based on userType
    // let role: 'ADMIN' | 'TEACHER' | 'STUDENT' = 'STUDENT';
    // if (data.userType === 'teacher') {
    //   role = 'TEACHER';
    // } else if (['student', 'learner'].includes(data.userType)) {
    //   role = 'STUDENT';
    // }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        purpose: data.purpose,
        userType: data.userType,
        classLevel: data.classLevel || null,
        skill: data.skill || null,
        onboardingCompleted: true,
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