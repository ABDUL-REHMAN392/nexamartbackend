import express from "express";
import {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  mergeCart,
} from "../controllers/cartController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Sab routes protected
router.use(protect);

// ─── Cart Routes ──────────────────────────────────
router.get("/",getCart);         // Cart lo
router.post("/",addToCart);       // Item add
router.post("/merge",mergeCart);       // Guest cart merge ← login ke baad
router.put("/:productId",updateQuantity);  // Quantity update
router.delete("/",clearCart);       // Poora clear
router.delete("/:productId",removeFromCart);  // Ek item remove

export default router;