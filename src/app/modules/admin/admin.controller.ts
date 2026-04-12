import { Request, Response } from "express";
import { AdminService } from "./admin.service";
import { OrderStatus, Role, UserStatus } from "../../../generated/enums";

const VALID_ROLES = Object.values(Role);
const VALID_STATUSES = Object.values(UserStatus);
const VALID_ORDER_STATUSES = Object.values(OrderStatus);

/* ───────────────────────────────────────────── */

const getStats = async (_req: Request, res: Response) => {
  try {
    const result = await AdminService.getStats();

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : "Failed to fetch stats",
    });
  }
};

/* ───────────────────────────────────────────── */

const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(String(req.query.page ?? "1"), 10) || 1;
    const limit = parseInt(String(req.query.limit ?? "12"), 10) || 12;
    const search = String(req.query.search ?? "");
    const role = req.query.role as Role;
    const status = req.query.status as UserStatus;

    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await AdminService.getUsers({
      page,
      limit,
      search,
      role,
      status,
    });

    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      error: e instanceof Error ? e.message : "Failed to fetch users",
    });
  }
};

/* ───────────────────────────────────────────── */

const updateUserRole = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (userId === user.id) {
      return res.status(400).json({ error: "Cannot change your own role" });
    }

    const result = await AdminService.updateUserRole(userId as string, role);

    res.status(200).json(result);
  } catch (e) {
    res
      .status(e instanceof Error && e.message.includes("not found") ? 404 : 400)
      .json({
        error: e instanceof Error ? e.message : "Failed to update role",
      });
  }
};

/* ───────────────────────────────────────────── */

const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId } = req.params;
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    if (userId === user.id) {
      return res.status(400).json({ error: "Cannot modify your own status" });
    }

    const result = await AdminService.updateUserStatus(
      userId as string,
      status,
    );

    res.status(200).json(result);
  } catch (e) {
    res
      .status(e instanceof Error && e.message.includes("not found") ? 404 : 400)
      .json({
        error: e instanceof Error ? e.message : "Failed to update status",
      });
  }
};

/* ───────────────────────────────────────────── */

const getOrders = async (req: Request, res: Response) => {
  try {
    const page = parseInt(String(req.query.page ?? "1"), 10) || 1;
    const limit = parseInt(String(req.query.limit ?? "12"), 10) || 12;
    const search = String(req.query.search ?? "");
    const status = req.query.status as OrderStatus;

    if (status && !VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await AdminService.getOrders({
      page,
      limit,
      search,
      status,
    });

    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      error: e instanceof Error ? e.message : "Failed to fetch orders",
    });
  }
};

/* ───────────────────────────────────────────── */

const getCategories = async (_req: Request, res: Response) => {
  try {
    const result = await AdminService.getCategories();

    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      error: e instanceof Error ? e.message : "Failed to fetch categories",
    });
  }
};

/* ───────────────────────────────────────────── */

const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    const result = await AdminService.createCategory(name.trim());

    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({
      error: e instanceof Error ? e.message : "Category creation failed",
    });
  }
};

/* ───────────────────────────────────────────── */

const updateCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    const result = await AdminService.updateCategory(
      categoryId as string,
      name.trim(),
    );

    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      error: e instanceof Error ? e.message : "Category update failed",
    });
  }
};

/* ───────────────────────────────────────────── */

const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;

    await AdminService.deleteCategory(categoryId as string);

    res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (e) {
    res.status(400).json({
      error: e instanceof Error ? e.message : "Category delete failed",
    });
  }
};

/* ───────────────────────────────────────────── */

export const AdminController = {
  getStats,
  getUsers,
  updateUserRole,
  updateUserStatus,
  getOrders,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
