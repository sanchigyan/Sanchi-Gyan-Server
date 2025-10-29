import { Request, Response, NextFunction } from 'express';
import { AdminLessonsService } from './admin-lessons.service';

const adminLessonsService = new AdminLessonsService();

export const createLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.user!.userId;
    const { moduleId } = req.params;
    const lessonData = req.body;

    const lesson = await adminLessonsService.createLesson(
      adminId,
      moduleId,
      lessonData
    );

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: lesson,
    });
  } catch (error) {
    next(error);
  }
};

export const getLessonsByModule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.user!.userId;
    const { moduleId } = req.params;

    const lessons = await adminLessonsService.getLessonsByModule(
      adminId,
      moduleId
    );

    res.json({
      success: true,
      data: lessons,
    });
  } catch (error) {
    next(error);
  }
};

export const getLessonById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.user!.userId;
    const { lessonId } = req.params;

    const lesson = await adminLessonsService.getLessonById(adminId, lessonId);

    res.json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.user!.userId;
    const { lessonId } = req.params;
    const lessonData = req.body;

    const lesson = await adminLessonsService.updateLesson(
      adminId,
      lessonId,
      lessonData
    );

    res.json({
      success: true,
      message: 'Lesson updated successfully',
      data: lesson,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.user!.userId;
    const { lessonId } = req.params;

    const result = await adminLessonsService.deleteLesson(adminId, lessonId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const reorderLessons = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.user!.userId;
    const { moduleId } = req.params;
    const { lessonOrders } = req.body;

    const result = await adminLessonsService.reorderLessons(
      adminId,
      moduleId,
      lessonOrders
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};