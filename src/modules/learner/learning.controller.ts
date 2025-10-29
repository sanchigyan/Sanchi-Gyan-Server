import { Request, Response, NextFunction } from 'express';
import { LearningService } from './learning.service';

const learningService = new LearningService();

export const getCourseStructure = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { courseId } = req.params;

    const data = await learningService.getCourseStructure(userId, courseId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { lessonId } = req.params;

    const data = await learningService.getLesson(userId, lessonId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { lessonId } = req.params;
    const progressData = req.body;

    const progress = await learningService.updateProgress(
      userId,
      lessonId,
      progressData
    );

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

export const markLessonComplete = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { lessonId } = req.params;

    const progress = await learningService.markLessonComplete(userId, lessonId);

    res.json({
      success: true,
      message: 'Lesson marked as complete',
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

export const getNextLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { lessonId } = req.params;

    const nextLesson = await learningService.getNextLesson(userId, lessonId);

    res.json({
      success: true,
      data: nextLesson,
    });
  } catch (error) {
    next(error);
  }
};