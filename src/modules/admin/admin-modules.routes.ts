import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  createModule,
  getModulesByCourse,
  getModuleById,
  updateModule,
  deleteModule,
  reorderModules,
} from './admin-modules.controller';

const router = Router();

router.use(authenticate);

// Module routes
router.post('/courses/:courseId/modules', createModule);
router.get('/courses/:courseId/modules', getModulesByCourse);
router.get('/modules/:moduleId', getModuleById);
router.put('/modules/:moduleId', updateModule);
router.delete('/modules/:moduleId', deleteModule);
router.post('/courses/:courseId/modules/reorder', reorderModules);

export default router;