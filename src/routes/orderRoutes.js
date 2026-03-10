import express from "express";
import {
  getMyOrders,
  getOrderById,
  placeOrder,
  cancelOrder,
} from "../controllers/orderController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ─── Customer Routes ──────────────────────────────
router.use(protect);

router.get("/", getMyOrders);
router.post("/", placeOrder);
router.get("/:orderId", getOrderById);
router.put("/:orderId/cancel", cancelOrder);

export default router;
