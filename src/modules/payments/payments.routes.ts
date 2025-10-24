import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { createPaymentIntent, confirmPayment } from './payments.controller';

const router = Router();

// All payment routes require authentication
router.use(authenticate);

router.post('/create-intent', createPaymentIntent);
router.post('/confirm', confirmPayment);

export default router;