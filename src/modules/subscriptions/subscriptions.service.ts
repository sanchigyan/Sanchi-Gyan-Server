import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { sendEmail } from '../../utils/email.util';
import { stripe } from '../../config/stripe';
import Stripe from 'stripe';

// Map frontend slugs to seeded UUID plan IDs (from your seed script; verify in DB)
const PLAN_SLUG_TO_ID: Record<string, string> = {
  free: '21b92f0d-426a-4bb0-88f9-1e3f2d1b4a57',
  basic: '825a304b-1cef-40cd-b3bd-6ee172fdd3ce',
  premium: '32ef983f-b3c4-4c98-a1d3-0682692049d2',
  pro: '8a291447-5588-41d1-918d-59efd25665a2',
};

// Hardcoded plans (keyed by slug; fetch from DB if you prefer dynamic)
const PLANS: Record<string, { monthly: number; annual: number; isTrial: boolean; trialDays?: number }> = {
  free: { monthly: 0, annual: 0, isTrial: true, trialDays: 7 },
  basic: { monthly: 799, annual: 7990, isTrial: false },
  premium: { monthly: 1299, annual: 12990, isTrial: false },
  pro: { monthly: 1999, annual: 19990, isTrial: false },
};

export class SubscriptionsService {
  async activateTrial(userId: string) {
    const existingSub = await prisma.subscription.findUnique({ where: { userId } });
    if (existingSub) throw new AppError('Subscription already exists', 400);

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) throw new AppError('User not found', 404);

    // CHANGE: Fetch the free plan dynamically by name
  const freePlan = await prisma.plan.findUnique({ 
    where: { name: 'Free Trial' }
  });
  
  if (!freePlan) throw new AppError('Free trial plan not found in database', 500);

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 7);

    const sub = await prisma.subscription.create({
      data: {
        userId,
        planId: freePlan.id,  // Use mapped UUID
        billingPeriod: 'MONTHLY', // Irrelevant for trial
        startDate: now,
        endDate,
        status: 'ACTIVE',
      },
    });

    // Set role to STUDENT
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'STUDENT' },
    });

    // Send welcome email with real user email
    // await sendEmail({ to: user.email, subject: 'Trial Started', text: 'Your 7-day trial has begun!' });

    return sub;
  }

  async createCheckoutSession(userId: string, planSlug: string, billingPeriod: 'monthly' | 'annual') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const plan = PLANS[planSlug];
    if (!plan) throw new AppError('Invalid plan', 400);

    const actualPlanId = PLAN_SLUG_TO_ID[planSlug];
    if (!actualPlanId) throw new AppError('Plan configuration missing', 500);

    const price = billingPeriod === 'monthly' ? plan.monthly : plan.annual;

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: 'subscription', // For recurring
      payment_method_types: ['card'],
      line_items: [{ price: 'your_stripe_price_id', quantity: 1 }], // Map to Stripe products/prices you create
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscriptions`,
      metadata: { userId, planId: planSlug, billingPeriod },  // Send slug in metadata; map on webhook
    });

    return session;
  }

  async handleWebhookEvent(event: Stripe.Event) {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, planId: planSlug, billingPeriod } = session.metadata as any;

      const actualPlanId = PLAN_SLUG_TO_ID[planSlug];
      if (!actualPlanId) throw new AppError('Invalid plan in webhook', 400);

      const now = new Date();
      const nextBilling = new Date(now);
      if (billingPeriod === 'monthly') nextBilling.setMonth(nextBilling.getMonth() + 1);
      else nextBilling.setFullYear(nextBilling.getFullYear() + 1);

      const sub = await prisma.subscription.create({
        data: {
          userId,
          planId: actualPlanId,  // Use mapped UUID
          billingPeriod: billingPeriod.toUpperCase(),
          startDate: now,
          nextBillingDate: nextBilling,
          status: 'ACTIVE',
        },
      });

      // Set role to STUDENT
      await prisma.user.update({ where: { id: userId }, data: { role: 'STUDENT' } });

      // Create Payment record
      await prisma.payment.create({
        data: {
          userId,
          subscriptionId: sub.id,  // Use actual new sub ID
          amount: session.amount_total! / 100,
          currency: session.currency ?? 'USD',
          stripePaymentIntentId: session.payment_intent as string,
          status: 'COMPLETED',
          paidAt: now,
        },
      });
    }
    // Handle other events like payment failed, etc.
  }

  async getSubscription(userId: string) {
    return prisma.subscription.findUnique({ where: { userId }, include: { plan: true } });
  }

  // Cron job methods (run daily via node-cron)
  async handleTrialExpirations() {
    const now = new Date();
    const freePlanId = PLAN_SLUG_TO_ID['free'];
    const expiredTrials = await prisma.subscription.findMany({
      where: { status: 'ACTIVE', endDate: { lt: now }, planId: freePlanId },  // Use UUID
    });

    for (const trial of expiredTrials) {
      await prisma.subscription.update({
        where: { id: trial.id },
        data: { status: 'EXPIRED' },
      });
      await prisma.user.update({
        where: { id: trial.userId },
        data: { role: null },
      });
      // Send expiry email (fetch user email)
      const user = await prisma.user.findUnique({ where: { id: trial.userId }, select: { email: true } });
      if (user) {
        await sendEmail({ to: user.email, subject: 'Trial Expired', text: 'Your trial has ended. Subscribe to continue.' });
      }
    }
  }

  async handleTrialNotifications() {
    const now = new Date();
    const freePlanId = PLAN_SLUG_TO_ID['free'];
    const trials = await prisma.subscription.findMany({
      where: { status: 'ACTIVE', planId: freePlanId, endDate: { gte: now } },  // Use UUID
    });

    for (const trial of trials) {
      // Calculate daysSinceStart first, as it's always available and precise for notifications
      const daysSinceStart = Math.floor((now.getTime() - trial.startDate.getTime()) / (1000 * 3600 * 24));
      const sentNotifications = await prisma.subscriptionNotification.findMany({
        where: { subscriptionId: trial.id },
      });

      let shouldNotify = false;
      let type = '';
      let daysLeft = 0; // Default; calculate only if needed

      // Since the query filters endDate >= now, endDate should not be null, but add guard for TS
      if (trial.endDate) {
        daysLeft = Math.floor((trial.endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      } else {
        // This shouldn't happen due to query filter, but skip if null
        continue;
      }

      // Check for notification triggers based on daysSinceStart (precise from start)
      if (daysSinceStart === 3 && !sentNotifications.some(n => n.type === 'reminder3')) {
        shouldNotify = true;
        type = 'reminder3';
      } else if (daysSinceStart === 6 && !sentNotifications.some(n => n.type === 'reminder6')) {
        shouldNotify = true;
        type = 'reminder6';
      } else if (daysSinceStart === 7 && !sentNotifications.some(n => n.type === 'final')) {
        shouldNotify = true;
        type = 'final';
      }

      if (shouldNotify) {
        const user = await prisma.user.findUnique({ where: { id: trial.userId }, select: { email: true } });
        if (user) {
          await sendEmail({ to: user.email, subject: `Trial Reminder: ${daysLeft} days left`, text: 'Upgrade now!' });
        }
        await prisma.subscriptionNotification.create({
          data: { subscriptionId: trial.id, type, sentAt: now },
        });
      }
    }
  }
}