import { Router } from 'express';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware';
import {
  getAllCourses,
  getCourseById,
  getUserEnrolledCourses,
} from './courses.controller';

const router = Router();

// Public routes
router.get('/', getAllCourses);
router.get('/:id', optionalAuth, getCourseById); // Optional auth to check enrollment

// Protected routes
router.get('/me/enrolled', authenticate, getUserEnrolledCourses);

export default router;