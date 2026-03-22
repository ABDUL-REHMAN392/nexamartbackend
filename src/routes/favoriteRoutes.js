import express from "express";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
  toggleFavorite,
  clearFavorites,
} from "../controllers/favoriteController.js";
import { protect, customerOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// only for logged-in customers — admin block
router.use(protect, customerOnly);

// ─── Favorites ────────────────────────────────────
router.get("/", getFavorites); 
router.post("/", addFavorite);
router.post("/toggle", toggleFavorite); // Toggle — frontend ke liye easy
router.delete("/", clearFavorites); 
router.get("/:productId/check", checkFavorite); // Heart icon check
router.delete("/:productId", removeFavorite); // Ek remove karo

export default router;