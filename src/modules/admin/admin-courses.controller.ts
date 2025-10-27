import { Request, Response, NextFunction } from 'express';
import { AdminCoursesService } from './admin-courses.service';

const adminCoursesService = new AdminCoursesService();

export const createCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.user!.userId;
    const courseData = req.body;

    const course = await adminCoursesService.createCourse(adminId, courseData);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.user!.userId;
    const { id } = req.params;
    const courseData = req.body;

    const course = await adminCoursesService.updateCourse(adminId, id, courseData);

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

export const togglePublishCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.user!.userId;
    const { id } = req.params;

    const course = await adminCoursesService.togglePublishCourse(adminId, id);

    res.json({
      success: true,
      message: `Course ${course.isPublished ? 'published' : 'unpublished'} successfully`,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.user!.userId;
    const { id } = req.params;

    const result = await adminCoursesService.deleteCourse(adminId, id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCoursesForAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.user!.userId;

    const courses = await adminCoursesService.getAllCoursesForAdmin(adminId);

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseForAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.user!.userId;
    const { id } = req.params;

    const course = await adminCoursesService.getCourseForAdmin(adminId, id);

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};