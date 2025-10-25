import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { stripe } from '../../config/stripe';

const PLANS: Record<string, { monthly: number; annual: number }> = {
  basic: { monthly: 799, annual: 7990 },
  premium: { monthly: 1299, annual: 12990 },
  pro: { monthly: 1999, annual: 19990 },
};

export class PaymentsService {
  async createPaymentIntent(
    userId: string,
    planSlug: string,
    billingPeriod: 'monthly' | 'annual'
  ) {
    // Validate plan
    const plan = PLANS[planSlug];
    if (!plan) {
      throw new AppError('Invalid plan selected', 400);
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullname: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Calculate amount
    const amount = billingPeriod === 'monthly' ? plan.monthly : plan.annual;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to paise/cents
      currency: 'inr',
      metadata: {
        userId,
        planSlug,
        billingPeriod,
      },
      description: `${planSlug.toUpperCase()} - ${billingPeriod} subscription`,
    });

    return paymentIntent;
  }

  async confirmPayment(userId: string, paymentIntentId: string) {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new AppError('Payment not successful', 400);
    }

    const { planSlug, billingPeriod } = paymentIntent.metadata as {
      planSlug: string;
      billingPeriod: string;
    };

    // Fetch plan from database
    const plan = await prisma.plan.findUnique({
      where: { name: this.getPlanName(planSlug) },
    });

    if (!plan) {
      throw new AppError('Plan not found in database', 500);
    }

    // Check if subscription already exists
    const existingSub = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (existingSub) {
      // Update existing subscription
      const now = new Date();
      const nextBilling = new Date(now);
      if (billingPeriod === 'monthly') {
        nextBilling.setMonth(nextBilling.getMonth() + 1);
      } else {
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
      }

      const updatedSub = await prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          planId: plan.id,
          billingPeriod: billingPeriod.toUpperCase() as 'MONTHLY' | 'ANNUAL',
          startDate: now,
          nextBillingDate: nextBilling,
          endDate: null,
          status: 'ACTIVE',
        },
        include: { plan: true },
      });

      // Update user role
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'STUDENT' },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          userId,
          subscriptionId: updatedSub.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          stripePaymentIntentId: paymentIntentId,
          status: 'COMPLETED',
          paidAt: now,
        },
      });

      return updatedSub;
    }

    // Create new subscription
    const now = new Date();
    const nextBilling = new Date(now);
    if (billingPeriod === 'monthly') {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    } else {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        billingPeriod: billingPeriod.toUpperCase() as 'MONTHLY' | 'ANNUAL',
        startDate: now,
        nextBillingDate: nextBilling,
        status: 'ACTIVE',
      },
      include: { plan: true },
    });

    // Update user role
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'STUDENT' },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        stripePaymentIntentId: paymentIntentId,
        status: 'COMPLETED',
        paidAt: now,
      },
    });

    return subscription;
  }

  private getPlanName(slug: string): string {
    const nameMap: Record<string, string> = {
      basic: 'Basic',
      premium: 'Premium',
      pro: 'Pro',
    };
    return nameMap[slug] || slug;
  }
}