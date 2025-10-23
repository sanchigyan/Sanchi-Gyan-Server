import { Request, Response, NextFunction } from 'express';

import { SubscriptionsService } from './subscriptions.service';
import { stripe } from '../../config/stripe';

const service = new SubscriptionsService();

export class SubscriptionsController {
  async activateTrial(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const subscription = await service.activateTrial(userId);
      res.json({ success: true, data: subscription, message: 'Trial activated' });
    } catch (error) {
      next(error);
    }
  }

  async createCheckoutSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { planId, billingPeriod } = req.body;
      const session = await service.createCheckoutSession(userId, planId, billingPeriod);
      res.json({ success: true, sessionId: session.id });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'] as string;
    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      await service.handleWebhookEvent(event);
      res.json({ received: true });
    } catch (err: any) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  async getSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const subscription = await service.getSubscription(userId);
      res.json({ success: true, data: subscription });
    } catch (error) {
      next(error);
    }
  }
}