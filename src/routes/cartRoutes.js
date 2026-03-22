import express from "express";
import {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  mergeCart,
} from "../controllers/cartController.js";
import { protect, customerOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// only for logged-in customers — admin block
router.use(protect, customerOnly);

// ─── Cart Routes ──────────────────────────────────
router.get("/",getCart);         
router.post("/",addToCart);      
router.post("/merge",mergeCart);       // Guest cart merge 
router.put("/:productId",updateQuantity);  
router.delete("/",clearCart);      
router.delete("/:productId",removeFromCart); 

export default router;