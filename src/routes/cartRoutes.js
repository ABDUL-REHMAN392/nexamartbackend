import express from "express";
import {
  getCart,
  addToCart,
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


export default router;