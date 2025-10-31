import { Router } from 'express';
import { LiveClassController } from './live-classes.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { body, param } from 'express-validator';

const router = Router();
const controller = new LiveClassController();

// Validation schemas
const createLiveClassValidation = [
  body('courseId').isUUID().withMessage('Valid course ID is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional({ nullable: true, checkFalsy: true }).trim(),
  body('scheduledAt').isISO8601().withMessage('Valid scheduled date is required'),
  body('durationMinutes').isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
  body('meetingLink').optional({ nullable: true, checkFalsy: true }).isURL().withMessage('Valid meeting link required'),
   body('meetingPlatform').optional().isIn(['ZOOM', 'GOOGLE_MEET', 'WEBRTC']).withMessage('Invalid meeting platform'),
  body('maxAttendees').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).withMessage('Max attendees must be at least 1'),
  body('thumbnailUrl').optional().isURL()
];

const updateLiveClassValidation = [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('scheduledAt').optional().isISO8601(),
  body('durationMinutes').optional().isInt({ min: 15, max: 480 }),
  body('meetingLink').optional().isURL(),
  body('recordingUrl').optional().isURL(),
  body('status').optional().isIn(['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED']),
  body('maxAttendees').optional().isInt({ min: 1 }),
  body('thumbnailUrl').optional().isURL()
];

const idValidation = [
  param('id').isUUID().withMessage('Valid ID is required')
];

// Routes
router.post(
  '/',
  authenticate,
  createLiveClassValidation,
  validateRequest,
  controller.create.bind(controller)
);

router.get(
  '/upcoming',
  authenticate,
  controller.getUpcoming.bind(controller)
);

router.get(
  '/course/:courseId',
  authenticate,
  param('courseId').isUUID(),
  validateRequest,
  controller.getByCourse.bind(controller)
);

router.get(
  '/:id',
  authenticate,
  idValidation,
  validateRequest,
  controller.getById.bind(controller)
);

router.patch(
  '/:id',
  authenticate,
  idValidation,
  updateLiveClassValidation,
  validateRequest,
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authenticate,
  idValidation,
  validateRequest,
  controller.delete.bind(controller)
);

router.post(
  '/:id/join',
  authenticate,
  idValidation,
  validateRequest,
  controller.join.bind(controller)
);

router.post(
  '/:id/leave',
  authenticate,
  idValidation,
  validateRequest,
  controller.leave.bind(controller)
);

export default router;