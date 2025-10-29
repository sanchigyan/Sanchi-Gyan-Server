import { Request, Response, NextFunction } from 'express';
import { AdminModulesService } from './admin-modules.service';

const adminModulesService = new AdminModulesService();

export const createModule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.user!.userId;
    const { courseId } = req.params;
    const moduleData = req.body;

    const module = await adminModulesService.createModule(
      adminId,
      courseId,
      moduleData
    );

    res.status(201).json({
      success: true,
      message: 'Module created successfully',
      data: module,
    });
  } catch (error) {
    next(error);
  }
};

export const getModulesByCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.user!.userId;
    const { courseId } = req.params;

    const modules = await adminModulesService.getModulesByCourse(
      adminId,
      courseId
    );

    res.json({
      success: true,
      data: modules,
    });
  } catch (error) {
    next(error);
  }
};

export const getModuleById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.user!.userId;
    const { moduleId } = req.params;

    const module = await adminModulesService.getModuleById(adminId, moduleId);

    res.json({
      success: true,
      data: module,
    });
  } catch (error) {
    next(error);
  }
};

export const updateModule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.user!.userId;
    const { moduleId } = req.params;
    const moduleData = req.body;

    const module = await adminModulesService.updateModule(
      adminId,
      moduleId,
      moduleData
    );

    res.json({
      success: true,
      message: 'Module updated successfully',
      data: module,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteModule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.user!.userId;
    const { moduleId } = req.params;

    const result = await adminModulesService.deleteModule(adminId, moduleId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const reorderModules = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.user!.userId;
    const { courseId } = req.params;
    const { moduleOrders } = req.body;

    const result = await adminModulesService.reorderModules(
      adminId,
      courseId,
      moduleOrders
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};