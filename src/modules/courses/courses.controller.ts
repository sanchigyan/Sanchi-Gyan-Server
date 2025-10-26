import { Request, Response, NextFunction } from 'express';
import { CoursesService } from './courses.service';

const coursesService = new CoursesService();

export const getAllCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, level, search } = req.query;

    const courses = await coursesService.getAllCourses({
      category: category as string,
      level: level as string,
      search: search as string,
    });

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const course = await coursesService.getCourseById(id);

    // Check if user is enrolled (if authenticated)
    let isEnrolled = false;
    if (req.user) {
      isEnrolled = await coursesService.isUserEnrolled(req.user.userId, id);
    }

    res.json({
      success: true,
      data: {
        ...course,
        isEnrolled,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserEnrolledCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const enrollments = await coursesService.getUserEnrolledCourses(userId);

    res.json({
      success: true,
      data: enrollments,
    });
  } catch (error) {
    next(error);
  }
};