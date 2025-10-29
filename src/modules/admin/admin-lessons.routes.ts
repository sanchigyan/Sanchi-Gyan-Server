import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  createLesson,
  getLessonsByModule,
  getLessonById,
  updateLesson,
  deleteLesson,
  reorderLessons,
} from './admin-lessons.controller';

const router = Router();

router.use(authenticate);

// Lesson routes
router.post('/modules/:moduleId/lessons', createLesson);
router.get('/modules/:moduleId/lessons', getLessonsByModule);
router.get('/lessons/:lessonId', getLessonById);
router.put('/lessons/:lessonId', updateLesson);
router.delete('/lessons/:lessonId', deleteLesson);
router.post('/modules/:moduleId/lessons/reorder', reorderLessons);

export default router;