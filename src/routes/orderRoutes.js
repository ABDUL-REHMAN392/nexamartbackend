import express from "express";
import {
  getMyOrders,
  getOrderById,
  placeOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { adminOnly, protect, customerOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ─── Customer Routes ──────────────────────────────
router.use(protect);

router.get("/",              customerOnly, getMyOrders);
router.post("/",             customerOnly, placeOrder);
router.get("/:orderId",      customerOnly, getOrderById);
router.put("/:orderId/cancel", customerOnly, cancelOrder);

// ─── Admin Routes ─────────────────────────────────
router.get("/admin/all",              adminOnly, getAllOrders);
router.put("/admin/:orderId/status",  adminOnly, updateOrderStatus);

export default router;