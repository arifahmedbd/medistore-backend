import { Router } from "express";
import { CustomerController } from "./customer.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/enums";

const router = Router();

// Checkout
router.post("/orders", auth(Role.CUSTOMER), CustomerController.placeOrder);

// Orders
router.get("/orders", auth(Role.CUSTOMER), CustomerController.getOrders);
router.get(
  "/orders/:orderId",
  auth(Role.CUSTOMER),
  CustomerController.getOrderById,
);
router.patch(
  "/orders/:orderId/cancel",
  auth(Role.CUSTOMER),
  CustomerController.cancelOrder,
);

// Profile
router.get("/profile", auth(Role.CUSTOMER), CustomerController.getProfile);
router.patch("/profile", auth(Role.CUSTOMER), CustomerController.updateProfile);
router.patch(
  "/profile/change-password",
  auth(Role.CUSTOMER),
  CustomerController.changePassword,
);

export const customerRoute = router;
