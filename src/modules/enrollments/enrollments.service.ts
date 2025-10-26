import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { stripe } from '../../config/stripe';

export class EnrollmentsService {
  // Create enrollment payment intent
  async createEnrollmentIntent(userId: string, courseId: string) {
    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        price: true,
        discountPrice: true,
      },
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      throw new AppError('You are already enrolled in this course', 400);
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullname: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Calculate amount (use discounted price if available)
    const amount = course.discountPrice || course.price;

    if (amount === 0) {
      // Free course - enroll directly
      const enrollment = await this.enrollUserInCourse(userId, courseId);
      return { isFree: true, enrollment };
    }

    // Create Stripe payment intent for paid courses
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId,
        courseId,
        courseTitle: course.title,
        type: 'course_enrollment',
      },
      description: `Enrollment for ${course.title}`,
    });

    return {
      isFree: false,
      clientSecret: paymentIntent.client_secret,
      amount,
    };
  }

  // Enroll user in course (after payment or for free courses)
  async enrollUserInCourse(userId: string, courseId: string) {
    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        progressPercentage: 0,
        lastAccessedAt: new Date(),
      },
      include: {
        course: {
          include: {
            teacher: {
              select: {
                fullname: true,
              },
            },
          },
        },
      },
    });

    // Increment enrollment count
    await prisma.course.update({
      where: { id: courseId },
      data: {
        enrollmentCount: {
          increment: 1,
        },
      },
    });

    return enrollment;
  }

  // Confirm payment and enroll
  async confirmEnrollmentPayment(userId: string, paymentIntentId: string) {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new AppError('Payment not successful', 400);
    }

    const { courseId } = paymentIntent.metadata as {
      courseId: string;
    };

    // Check if already enrolled (prevent double enrollment)
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return existingEnrollment; // Already enrolled, return existing
    }

    // Create enrollment
    const enrollment = await this.enrollUserInCourse(userId, courseId);

    // Create payment record
    await prisma.payment.create({
      data: {
        userId,
        courseId,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        stripePaymentIntentId: paymentIntentId,
        status: 'COMPLETED',
        paidAt: new Date(),
      },
    });

    return enrollment;
  }

  // Get enrollment details
  async getEnrollmentDetails(userId: string, courseId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        course: {
          include: {
            sections: {
              include: {
                videos: {
                  orderBy: { orderIndex: 'asc' },
                },
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }

    return enrollment;
  }
}