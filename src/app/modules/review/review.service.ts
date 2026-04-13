import { prisma } from "../../../lib/prisma";

const createReview = async (
  userId: string,
  medicineId: string,
  rating: number,
  comment: string,
) => {
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  if (!comment || comment.trim().length === 0) {
    throw new Error("Comment is required");
  }

  const purchased = await prisma.orderItem.findFirst({
    where: {
      medicineId,
      order: {
        userId,
        status: { not: "CANCELLED" },
      },
    },
  });

  if (!purchased) {
    throw new Error("You can only review medicines you purchased");
  }

  const existing = await prisma.review.findFirst({
    where: { userId, medicineId },
  });

  if (existing) {
    throw new Error("You already reviewed this medicine");
  }

  const review = await prisma.review.create({
    data: { userId, medicineId, rating, comment },
  });

  return {
    success: true,
    data: review,
  };
};

const getReviewsByMedicine = async (medicineId: string) => {
  if (!medicineId) {
    throw new Error("Medicine ID is required");
  }

  const reviews = await prisma.review.findMany({
    where: { medicineId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    data: reviews,
  };
};

const updateReview = async (
  userId: string,
  reviewId: string,
  data: { rating?: number; comment?: string },
) => {
  if (data.rating && (data.rating < 1 || data.rating > 5)) {
    throw new Error("Rating must be between 1 and 5");
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new Error("Review not found");
  }

  if (review.userId !== userId) {
    throw new Error("You cannot update this review");
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data,
  });

  return {
    success: true,
    data: updated,
  };
};

const deleteReview = async (userId: string, role: string, reviewId: string) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new Error("Review not found");
  }

  if (review.userId !== userId && role !== "ADMIN") {
    throw new Error("You cannot delete this review");
  }

  await prisma.review.delete({
    where: { id: reviewId },
  });

  return {
    success: true,
    message: "Review deleted successfully",
  };
};

export const ReviewService = {
  createReview,
  getReviewsByMedicine,
  updateReview,
  deleteReview,
};
