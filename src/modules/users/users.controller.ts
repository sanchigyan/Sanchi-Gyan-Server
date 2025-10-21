import { Request, Response, NextFunction } from 'express';
import { UserService } from './users.service';

const userService = new UserService();

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserById(req.user!.userId);
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { fullname, profileImageUrl } = req.body;
      const user = await userService.updateProfile(req.user!.userId, {
        fullname,
        profileImageUrl,
      });
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await userService.changePassword(
        req.user!.userId,
        currentPassword,
        newPassword
      );
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await userService.getAllUsers(page, limit);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserById(req.params.id);
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.body;
      const user = await userService.updateUserRole(req.params.id, role);
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.deleteUser(req.params.id);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}