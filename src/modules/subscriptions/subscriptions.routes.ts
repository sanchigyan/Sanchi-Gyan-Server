import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { SubscriptionsController } from './subscriptions.controller';

const router = Router();
const controller = new SubscriptionsController();

router.post('/me/trial', authenticate, controller.activateTrial);
router.post('/me/checkout', authenticate, controller.createCheckoutSession);
router.post('/webhook', controller.handleWebhook); // Stripe webhook for payment success/failure
router.get('/me', authenticate, controller.getSubscription);

export default router;