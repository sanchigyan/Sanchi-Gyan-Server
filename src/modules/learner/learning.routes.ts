import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  getCourseStructure,
  getLesson,
  updateProgress,
  markLessonComplete,
  getNextLesson,
} from './learning.controller';

const router = Router();

router.use(authenticate);

// Learning routes
router.get('/courses/:courseId/structure', getCourseStructure);
router.get('/lessons/:lessonId', getLesson);
router.post('/lessons/:lessonId/progress', updateProgress);
router.post('/lessons/:lessonId/complete', markLessonComplete);
router.get('/lessons/:lessonId/next', getNextLesson);

export default router;