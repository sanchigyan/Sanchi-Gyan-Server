import { Request, Response, NextFunction } from 'express';
import { LiveClassService } from './live-classes.service';
import { AppError } from '../../middleware/error.middleware';

const service = new LiveClassService();

export class LiveClassController {
  // Create live class
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      console.log('📥 Received data:', req.body);

      const liveClass = await service.createLiveClass(req.body, userId);
      
      res.status(201).json({
        success: true,
        data: liveClass
      });
    } catch (error) {
      console.error('❌ Error in create controller:', error);
      next(error);
    }
  }

  // Get live class by ID
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const liveClass = await service.getLiveClassById(id);
      
      res.json({
        success: true,
        data: liveClass
      });
    } catch (error) {
      next(error);
    }
  }

  // Get live classes by course
  async getByCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.params;
      const learnerId = req.user?.userId;
      
      const liveClasses = await service.getLiveClassesByCourse(courseId, learnerId);
      
      res.json({
        success: true,
        data: liveClasses
      });
    } catch (error) {
      next(error);
    }
  }

  // Get upcoming classes for learner
  async getUpcoming(req: Request, res: Response, next: NextFunction) {
    try {
      const learnerId = req.user?.userId;
      if (!learnerId) {
        throw new AppError('Unauthorized', 401);
      }

      const liveClasses = await service.getUpcomingClassesForLearner(learnerId);
      
      res.json({
        success: true,
        data: liveClasses
      });
    } catch (error) {
      next(error);
    }
  }

  // Update live class
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const liveClass = await service.updateLiveClass(id, req.body, userId);
      
      res.json({
        success: true,
        data: liveClass
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete live class
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      await service.deleteLiveClass(id, userId);
      
      res.json({
        success: true,
        message: 'Live class deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Join live class
  async join(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const learnerId = req.user?.userId;
      if (!learnerId) {
        throw new AppError('Unauthorized', 401);
      }

      const result = await service.joinLiveClass(id, learnerId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Leave live class
  async leave(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const learnerId = req.user?.userId;
      if (!learnerId) {
        throw new AppError('Unauthorized', 401);
      }

      await service.leaveLiveClass(id, learnerId);
      
      res.json({
        success: true,
        message: 'Left live class successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}