import { LiveClassStatus, MeetingPlatform } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import logger from '../../utils/logger';

export interface CreateLiveClassDTO {
    courseId: string;
    title: string;
    description?: string;
    scheduledAt: Date;
    durationMinutes: number;
    meetingLink?: string;
    meetingPlatform?: MeetingPlatform;
    maxAttendees?: number;
    thumbnailUrl?: string;
}

export interface UpdateLiveClassDTO {
    title?: string;
    description?: string;
    scheduledAt?: Date;
    durationMinutes?: number;
    meetingLink?: string;
    recordingUrl?: string;
    status?: LiveClassStatus;
    maxAttendees?: number;
    thumbnailUrl?: string;
}

export class LiveClassService {
    // Create a new live class
    async createLiveClass(data: CreateLiveClassDTO, createdById: string) {
        try {
            // Verify course exists
            const course = await prisma.course.findUnique({
                where: { id: data.courseId }
            });

            if (!course) {
                throw new AppError('Course not found', 404);
            }

            // Verify user has permission (is admin or teacher of the course)
            if (course.teacherId !== createdById) {
                const user = await prisma.user.findUnique({
                    where: { id: createdById }
                });
                if (user?.role !== 'ADMIN') {
                    throw new AppError('Unauthorized to create live class for this course', 403);
                }
            }

            // Create live class
            const liveClass = await prisma.liveClass.create({
                data: {
                    courseId: data.courseId,
                    title: data.title,
                    description: data.description,
                    scheduledAt: data.scheduledAt,
                    durationMinutes: data.durationMinutes,
                    meetingLink: data.meetingLink,
                    meetingPlatform: data.meetingPlatform || MeetingPlatform.ZOOM,
                    maxAttendees: data.maxAttendees,
                    createdById,
                    status: LiveClassStatus.SCHEDULED,
                    isRecurring: false,
                    recurringPattern: null,
                    notificationSent: false,
                },
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                            thumbnailUrl: true
                        }
                    },
                    createdBy: {
                        select: {
                            id: true,
                            fullname: true,
                            email: true
                        }
                    }
                }
            });

            // Create reminders for all enrolled learners
            await this.createRemindersForEnrolledLearners(liveClass.id, data.courseId);

            logger.info(`Live class created: ${liveClass.id}`);
            return liveClass;
        } catch (error) {
            logger.error('Error creating live class:', error);
            throw error;
        }
    }

    // Get live class by ID
    async getLiveClassById(id: string) {
        const liveClass = await prisma.liveClass.findUnique({
            where: { id },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        thumbnailUrl: true,
                        teacherId: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        fullname: true,
                        email: true,
                        profileImageUrl: true
                    }
                },
                attendances: {
                    include: {
                        learner: {
                            select: {
                                id: true,
                                fullname: true,
                                email: true,
                                profileImageUrl: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        attendances: true
                    }
                }
            }
        });

        if (!liveClass) {
            throw new AppError('Live class not found', 404);
        }

        return liveClass;
    }

    // Get all live classes for a course
    async getLiveClassesByCourse(courseId: string, learnerId?: string) {
        const liveClasses = await prisma.liveClass.findMany({
            where: { courseId },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        fullname: true,
                        profileImageUrl: true
                    }
                },
                attendances: learnerId ? {
                    where: { learnerId }
                } : false,
                _count: {
                    select: {
                        attendances: true
                    }
                }
            },
            orderBy: {
                scheduledAt: 'asc'
            }
        });

        return liveClasses;
    }

    // Get upcoming live classes for a learner
    async getUpcomingClassesForLearner(learnerId: string) {
        // Get all enrolled courses
        const enrollments = await prisma.enrollment.findMany({
            where: { userId: learnerId },
            select: { courseId: true }
        });

        const courseIds = enrollments.map(e => e.courseId);

        // Get upcoming live classes
        const now = new Date();
        const liveClasses = await prisma.liveClass.findMany({
            where: {
                courseId: { in: courseIds },
                scheduledAt: { gte: now },
                status: { in: [LiveClassStatus.SCHEDULED, LiveClassStatus.LIVE] }
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        thumbnailUrl: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        fullname: true,
                        profileImageUrl: true
                    }
                },
                attendances: {
                    where: { learnerId }
                },
                _count: {
                    select: {
                        attendances: true
                    }
                }
            },
            orderBy: {
                scheduledAt: 'asc'
            },
            take: 10
        });

        return liveClasses;
    }

    // Update live class
    async updateLiveClass(id: string, data: UpdateLiveClassDTO, userId: string) {
        const liveClass = await prisma.liveClass.findUnique({
            where: { id },
            include: { course: true }
        });

        if (!liveClass) {
            throw new AppError('Live class not found', 404);
        }

        // Check permissions
        if (liveClass.createdById !== userId && liveClass.course.teacherId !== userId) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user?.role !== 'ADMIN') {
                throw new AppError('Unauthorized to update this live class', 403);
            }
        }

        const updated = await prisma.liveClass.update({
            where: { id },
            data,
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        thumbnailUrl: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        fullname: true,
                        email: true
                    }
                }
            }
        });

        logger.info(`Live class updated: ${id}`);
        return updated;
    }

    // Delete live class
    async deleteLiveClass(id: string, userId: string) {
        const liveClass = await prisma.liveClass.findUnique({
            where: { id },
            include: { course: true }
        });

        if (!liveClass) {
            throw new AppError('Live class not found', 404);
        }

        // Check permissions
        if (liveClass.createdById !== userId && liveClass.course.teacherId !== userId) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user?.role !== 'ADMIN') {
                throw new AppError('Unauthorized to delete this live class', 403);
            }
        }

        await prisma.liveClass.delete({ where: { id } });
        logger.info(`Live class deleted: ${id}`);
    }

    // Join a live class (track attendance)
    async joinLiveClass(liveClassId: string, learnerId: string) {
        const liveClass = await prisma.liveClass.findUnique({
            where: { id: liveClassId },
            include: { course: true }
        });

        if (!liveClass) {
            throw new AppError('Live class not found', 404);
        }

        // Check if learner is enrolled in the course
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: learnerId,
                    courseId: liveClass.courseId
                }
            }
        });

        if (!enrollment) {
            throw new AppError('You must be enrolled in this course to join the live class', 403);
        }

        // Check if class is joinable (within ±15 minutes of start time)
        const now = new Date();
        const scheduledTime = new Date(liveClass.scheduledAt);
        const timeDiff = (now.getTime() - scheduledTime.getTime()) / (1000 * 60); // minutes

        if (timeDiff < -15) {
            throw new AppError('Live class has not started yet. You can join 15 minutes before.', 400);
        }

        const endTime = new Date(scheduledTime.getTime() + liveClass.durationMinutes * 60 * 1000);
        if (now > endTime) {
            throw new AppError('Live class has ended', 400);
        }

        // Check max attendees
        if (liveClass.maxAttendees) {
            const currentAttendees = await prisma.liveClassAttendance.count({
                where: {
                    liveClassId,
                    leftAt: null // Still in the class
                }
            });

            if (currentAttendees >= liveClass.maxAttendees) {
                throw new AppError('Live class is full', 400);
            }
        }

        // Create or update attendance record
        const attendance = await prisma.liveClassAttendance.upsert({
            where: {
                liveClassId_learnerId: {
                    liveClassId,
                    learnerId
                }
            },
            create: {
                liveClassId,
                learnerId,
                joinedAt: now
            },
            update: {
                joinedAt: now,
                leftAt: null,
                durationMins: null
            }
        });

        // Update class status to LIVE if it's the first attendee
        if (liveClass.status === LiveClassStatus.SCHEDULED) {
            await prisma.liveClass.update({
                where: { id: liveClassId },
                data: { status: LiveClassStatus.LIVE }
            });
        }

        logger.info(`Learner ${learnerId} joined live class ${liveClassId}`);
        return { attendance, meetingLink: liveClass.meetingLink };
    }

    // Leave a live class
    async leaveLiveClass(liveClassId: string, learnerId: string) {
        const attendance = await prisma.liveClassAttendance.findUnique({
            where: {
                liveClassId_learnerId: {
                    liveClassId,
                    learnerId
                }
            }
        });

        if (!attendance) {
            throw new AppError('Attendance record not found', 404);
        }

        const joinedAt = attendance.joinedAt;
        if (!joinedAt) {
            throw new AppError('Invalid attendance record - no join time', 400);
        }

        const now = new Date();
        const durationMins = Math.round((now.getTime() - joinedAt.getTime()) / (1000 * 60));

        await prisma.liveClassAttendance.update({
            where: {
                liveClassId_learnerId: {
                    liveClassId,
                    learnerId
                }
            },
            data: {
                leftAt: now,
                durationMins: durationMins
            }
        });

        logger.info(`Learner ${learnerId} left live class ${liveClassId}`);
    }

    // Helper: Create reminders for enrolled learners
    private async createRemindersForEnrolledLearners(liveClassId: string, courseId: string) {
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId },
            select: { userId: true }
        });

        const liveClass = await prisma.liveClass.findUnique({
            where: { id: liveClassId }
        });

        if (!liveClass) return;

        // Create reminder 1 hour before
        const reminderTime = new Date(liveClass.scheduledAt.getTime() - 60 * 60 * 1000);

        const reminders = enrollments.map(enrollment => ({
            liveClassId,
            learnerId: enrollment.userId,
            reminderAt: reminderTime,
            type: 'email'
        }));

        await prisma.liveClassReminder.createMany({
            data: reminders,
            skipDuplicates: true
        });

        logger.info(`Created ${reminders.length} reminders for live class ${liveClassId}`);
    }

    // Cron job: Update status of live classes
    async updateLiveClassStatuses() {
        const now = new Date();

        // Mark SCHEDULED classes as LIVE if within start window
        await prisma.liveClass.updateMany({
            where: {
                status: LiveClassStatus.SCHEDULED,
                scheduledAt: {
                    lte: new Date(now.getTime() + 15 * 60 * 1000) // Within 15 minutes
                }
            },
            data: { status: LiveClassStatus.LIVE }
        });

        // Mark LIVE classes as COMPLETED if past end time
        const liveClasses = await prisma.liveClass.findMany({
            where: { status: LiveClassStatus.LIVE }
        });

        for (const liveClass of liveClasses) {
            const endTime = new Date(liveClass.scheduledAt.getTime() + liveClass.durationMinutes * 60 * 1000);
            if (now > endTime) {
                await prisma.liveClass.update({
                    where: { id: liveClass.id },
                    data: { status: LiveClassStatus.COMPLETED }
                });
            }
        }

        logger.info('Live class statuses updated');
    }

    // Send reminders
    async sendReminders() {
        const now = new Date();

        const pendingReminders = await prisma.liveClassReminder.findMany({
            where: {
                sentAt: null,
                reminderAt: {
                    lte: now
                }
            },
            include: {
                liveClass: {
                    include: {
                        course: true
                    }
                },
                learner: true
            }
        });

        for (const reminder of pendingReminders) {
            try {
                // TODO: Implement email/push notification
                // await sendEmail(reminder.learner.email, ...)

                await prisma.liveClassReminder.update({
                    where: { id: reminder.id },
                    data: { sentAt: now }
                });

                logger.info(`Reminder sent to ${reminder.learner.email} for live class ${reminder.liveClass.title}`);
            } catch (error) {
                logger.error(`Failed to send reminder ${reminder.id}:`, error);
            }
        }
    }
}