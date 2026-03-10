import express from "express";
import {
  createReview,
  getProductReviews,
  getMyReviews,
  checkMyReview,
  updateReview,
  deleteReview,
  toggleHelpful,
  getAllReviews,
  toggleHideReview,
  adminDeleteReview,
} from "../controllers/reviewController.js";
import { adminOnly, protect} from "../middlewares/authMiddleware.js";

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

// ─── Admin Routes ─────────────────────────────────
router.get("/admin/all", adminOnly, getAllReviews);
router.put("/admin/:id/hide", adminOnly, toggleHideReview);
router.delete("/admin/:id", adminOnly, adminDeleteReview);


export default router;
