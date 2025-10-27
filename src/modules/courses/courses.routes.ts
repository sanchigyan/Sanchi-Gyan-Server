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
// Protected routes
router.get('/me/enrolled', authenticate, getUserEnrolledCourses);

// Public routes
router.get('/:id', optionalAuth, getCourseById); // Optional auth to check enrollment

export default router;