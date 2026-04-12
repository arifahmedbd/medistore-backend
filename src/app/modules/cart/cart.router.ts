// src/modules/cart/cart.routes.ts
import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/enums";
import { CartController } from "./cart.controller";

const router = Router();

router.get("/", auth(Role.CUSTOMER), CartController.getCart);
router.post(
  "/items",

  auth(Role.CUSTOMER),
  CartController.addItem,
);
router.patch("/items/:itemId", auth(Role.CUSTOMER), CartController.updateItem);
router.delete("/items/:itemId", auth(Role.CUSTOMER), CartController.removeItem);
router.delete("/", auth(Role.CUSTOMER), CartController.clearCart);

export const cartRoute = router;
