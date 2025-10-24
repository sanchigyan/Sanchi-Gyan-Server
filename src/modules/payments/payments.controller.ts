import { Request, Response, NextFunction } from 'express';
import { PaymentsService } from './payments.service';

const paymentsService = new PaymentsService();

export const createPaymentIntent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { planId, billingPeriod } = req.body;

    if (!planId || !billingPeriod) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID and billing period are required',
      });
    }

    const paymentIntent = await paymentsService.createPaymentIntent(
      userId,
      planId,
      billingPeriod
    );

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const confirmPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { paymentIntentId } = req.body;

    const subscription = await paymentsService.confirmPayment(
      userId,
      paymentIntentId
    );

    res.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};