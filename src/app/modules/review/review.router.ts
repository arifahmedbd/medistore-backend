import { Router } from "express";
import { ReviewController } from "./review.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/enums";

const router = Router();

router.get("/medicine/:medicineId", ReviewController.getReviewsByMedicine);

router.post("/", auth(Role.CUSTOMER), ReviewController.createReview);

router.put("/:id", auth(Role.CUSTOMER), ReviewController.updateReview);

router.delete(
  "/:id",
  auth(Role.CUSTOMER, Role.ADMIN),
  ReviewController.deleteReview,
);

export const reviewRoute = router;
