import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/enums";
import { CustomerController } from "./customer.controller";

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

export const customerRoute = router;
