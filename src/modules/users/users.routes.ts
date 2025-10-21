import { Router } from 'express';
import { OnboardingController } from './onboarding.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { UserController } from './users.controller';

const router = Router();
const userController = new UserController();
const onboardingController = new OnboardingController();

// Protected routes (require authentication)
router.get('/me', authenticate, userController.getProfile);
router.put('/me', authenticate, userController.updateProfile);
router.put('/me/password', authenticate, userController.changePassword);

// Onboarding routes (NEW)
router.post('/me/onboarding', authenticate, onboardingController.updateOnboarding);
router.get('/me/onboarding', authenticate, onboardingController.getOnboardingStatus);

// Admin only routes
router.get('/', authenticate, requireRole('ADMIN'), userController.getAllUsers);
router.get('/:id', authenticate, requireRole('ADMIN'), userController.getUserById);
router.patch('/:id/role', authenticate, requireRole('ADMIN'), userController.updateUserRole);
router.delete('/:id', authenticate, requireRole('ADMIN'), userController.deleteUser);

export default router;