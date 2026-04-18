import { Router, Request, Response, NextFunction } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/enums";
import { AdminController } from "./admin.controller";

const router = Router();

router.get("/stats", auth(Role.ADMIN), AdminController.getStats);

router.get("/users", auth(Role.ADMIN), AdminController.getUsers);
router.patch(
  "/users/:userId/role",
  auth(Role.ADMIN),
  AdminController.updateUserRole,
);
router.patch(
  "/users/:userId/status",
  auth(Role.ADMIN),
  AdminController.updateUserStatus,
);

router.get("/orders", auth(Role.ADMIN), AdminController.getOrders);

router.get("/categories", AdminController.getCategories);
router.post("/categories", auth(Role.ADMIN), AdminController.createCategory);
router.patch(
  "/categories/:categoryId",
  auth(Role.ADMIN),
  AdminController.updateCategory,
);
router.delete(
  "/categories/:categoryId",
  auth(Role.ADMIN),
  AdminController.deleteCategory,
);

export const adminRoute = router;
