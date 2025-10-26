import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  createEnrollmentIntent,
  confirmEnrollmentPayment,
  getEnrollmentDetails,
} from './enrollments.controller';

const router = Router();

// All enrollment routes require authentication
router.use(authenticate);

router.post('/create-intent', createEnrollmentIntent);
router.post('/confirm', confirmEnrollmentPayment);
router.get('/:courseId', getEnrollmentDetails);

export default router;