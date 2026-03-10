import express from "express";
import {
  getMyOrders,
  getOrderById,
  placeOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { adminOnly, protect } from "../middlewares/authMiddleware.js";
import { createPaymentIntent } from "../controllers/stripeController.js";

const router = express.Router();

// ─── Customer Routes ──────────────────────────────
router.use(protect);

router.get("/", getMyOrders);
router.post("/", placeOrder);
router.post("/create-payment-intent",  createPaymentIntent);   // Stripe — payment intent
router.get("/:orderId", getOrderById);
router.put("/:orderId/cancel", cancelOrder);

// ─── Admin Routes ─────────────────────────────────
router.get("/admin/all", adminOnly, getAllOrders);
router.put("/admin/:orderId/status", adminOnly, updateOrderStatus);

export default router;
