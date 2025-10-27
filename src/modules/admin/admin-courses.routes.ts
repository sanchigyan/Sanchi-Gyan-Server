import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  createCourse,
  updateCourse,
  togglePublishCourse,
  deleteCourse,
  getAllCoursesForAdmin,
  getCourseForAdmin,
} from './admin-courses.controller';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Course management routes
router.post('/', createCourse);
router.get('/', getAllCoursesForAdmin);
router.get('/:id', getCourseForAdmin);
router.put('/:id', updateCourse);
router.patch('/:id/publish', togglePublishCourse);
router.delete('/:id', deleteCourse);

export default router;