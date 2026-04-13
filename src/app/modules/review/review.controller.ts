import { Request, Response } from "express";
import { ReviewService } from "./review.service";

const createReview = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { medicineId, rating, comment } = req.body;

    if (!medicineId || rating === undefined || !comment) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const result = await ReviewService.createReview(
      user.id,
      medicineId,
      rating,
      comment,
    );

    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({
      error: e instanceof Error ? e.message : "Failed to create review",
    });
  }
};

const getReviewsByMedicine = async (req: Request, res: Response) => {
  try {
    const { medicineId } = req.params;

    if (!medicineId) {
      return res.status(400).json({
        error: "Medicine ID is required",
      });
    }

    const result = await ReviewService.getReviewsByMedicine(
      medicineId as string,
    );

    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      error: e instanceof Error ? e.message : "Failed to fetch reviews",
    });
  }
};

const updateReview = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const reviewId = req.params.id;

    if (!reviewId) {
      return res.status(400).json({
        error: "Review ID is required",
      });
    }

    const result = await ReviewService.updateReview(
      user.id,
      reviewId as string,
      req.body,
    );

    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      error: e instanceof Error ? e.message : "Failed to update review",
    });
  }
};

const deleteReview = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user?.id || !user?.role) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const reviewId = req.params.id;

    if (!reviewId) {
      return res.status(400).json({
        error: "Review ID is required",
      });
    }

    const result = await ReviewService.deleteReview(
      user.id,
      user.role,
      reviewId as string,
    );

    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      error: e instanceof Error ? e.message : "Failed to delete review",
    });
  }
};

export const ReviewController = {
  createReview,
  getReviewsByMedicine,
  updateReview,
  deleteReview,
};
