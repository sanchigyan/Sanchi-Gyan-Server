import { Request, Response, NextFunction } from 'express';
import { EnrollmentsService } from './enrollments.service';

const enrollmentsService = new EnrollmentsService();

export const createEnrollmentIntent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required',
      });
    }

    const result = await enrollmentsService.createEnrollmentIntent(
      userId,
      courseId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const confirmEnrollmentPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { paymentIntentId } = req.body;

    const enrollment = await enrollmentsService.confirmEnrollmentPayment(
      userId,
      paymentIntentId
    );

    res.json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
};

export const getEnrollmentDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { courseId } = req.params;

    const enrollment = await enrollmentsService.getEnrollmentDetails(
      userId,
      courseId
    );

    res.json({
      success: true,
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
};