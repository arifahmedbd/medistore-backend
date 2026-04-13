import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/enums";
import { SellerController } from "./seller.controller";

const router = Router();

// Dashboard
router.get("/stats", auth(Role.SELLER), SellerController.getStats);

// Orders
router.get("/orders", auth(Role.SELLER), SellerController.getOrders);
router.patch(
  "/orders/:orderId/status",
  auth(Role.SELLER),
  SellerController.updateOrderStatus,
);

// Medicines
router.get("/medicines", auth(Role.SELLER), SellerController.getMedicines);
router.post("/medicines", auth(Role.SELLER), SellerController.createMedicine);
router.patch(
  "/medicines/:medicineId",
  auth(Role.SELLER),
  SellerController.updateMedicine,
);
router.delete(
  "/medicines/:medicineId",
  auth(Role.SELLER),
  SellerController.deleteMedicine,
);

export const sellerRoute = router;
