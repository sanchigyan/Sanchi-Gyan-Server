import { Request, Response, NextFunction } from 'express';
import { OnboardingService } from './onboarding.service';

const onboardingService = new OnboardingService();

export class OnboardingController {
  async updateOnboarding(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { purpose, userType, classLevel, skill } = req.body;

      const user = await onboardingService.updateOnboarding(userId, {
        purpose,
        userType,
        classLevel,
        skill,
      });

      res.json({
        success: true,
        message: 'Onboarding completed successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOnboardingStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const status = await onboardingService.getOnboardingStatus(userId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }
}