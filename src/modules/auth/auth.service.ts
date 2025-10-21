import prisma from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/password.util';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.util';
import { AppError } from '../../middleware/error.middleware';
import crypto from 'crypto';

export class AuthService {
  async signup(data: {
    email: string;
    password: string;
    fullname: string;
  }) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullname: data.fullname,
        role: 'STUDENT',
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async signin(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If email exists, reset link has been sent' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Store token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      },
    });

    // TODO: Send email with reset link
    // For now, just log it
    console.log(`Reset token for ${email}: ${resetToken}`);

    return { message: 'If email exists, reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetToken) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    return { message: 'Password reset successful' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const { userId } = verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.isActive) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Generate new access token
      const newAccessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Optionally generate a new refresh token (token rotation)
      const newRefreshToken = generateRefreshToken(user.id);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,  // Send new one if rotating
      };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
        profileImageUrl: true,  // If you have this field
        isEmailVerified: true,  // If you have this field
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
}