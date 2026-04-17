import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/enums";
import { SellerController } from "./seller.controller";

const router = Router();

router.get("/stats", auth(Role.SELLER), SellerController.getStats);

router.get("/orders", auth(Role.SELLER), SellerController.getOrders);
router.patch(
  "/orders/:orderId/status",
  auth(Role.SELLER),
  SellerController.updateOrderStatus,
);

router.get("/medicines", SellerController.getMedicines);
router.get("/medicines/:medicineId", SellerController.getMedicineById);
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
