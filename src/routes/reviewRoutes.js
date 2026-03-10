import express from "express";
import {
  createReview,
  getProductReviews,
  getMyReviews,
  checkMyReview,
  updateReview,
  deleteReview,
  toggleHelpful,
} from "../controllers/reviewController.js";
import { protect} from "../middlewares/authMiddleware.js";

const router = express.Router();

// ─── Public Routes ────────────────────────────────
router.get("/product/:productId", getProductReviews);

// ─── Protected Routes ─────────────────────────────
router.use(protect);

router.get("/my", getMyReviews);
router.get("/check/:productId", checkMyReview);
router.post("/", createReview);
router.put("/:id", updateReview);
router.delete("/:id", deleteReview);
router.post("/:id/helpful", toggleHelpful);

export default router;
